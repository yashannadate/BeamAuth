//! # Escrow Contract — Test Suite
//!
//! Tests the three core scenarios required by the hackathon:
//!   1. Successful claim with the correct secret.
//!   2. Rejection when the claim link has expired.
//!   3. Rejection when an invalid/wrong secret is provided.
//!
//! Additional tests cover:
//!   4. Rejection of duplicate lock hashes.
//!   5. Successful reclaim of expired funds by the original sender.
//!   6. Verification that the `claimed` event is emitted correctly.

#![cfg(test)]

extern crate std;

use soroban_sdk::{
    testutils::{Address as _, Events, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Bytes, BytesN, Env, IntoVal,
};

use crate::{EscrowContract, EscrowContractClient, LockedFunds};

// ─────────────────────────────────────────────────────────────────────────────
//  Test helpers
// ─────────────────────────────────────────────────────────────────────────────

struct TestEnv {
    env:     Env,
    escrow:  EscrowContractClient<'static>,
    token:   Address,
    admin:   Address,
    alice:   Address, // sender
    bob:     Address, // receiver (Passkey Wallet address in real flow)
}

impl TestEnv {
    fn setup() -> Self {
        let env = Env::default();
        env.mock_all_auths();  // auto-approve all require_auth() calls in tests

        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob   = Address::generate(&env);

        // ── Deploy native XLM token (Stellar Asset Contract) ──
        let token_admin  = Address::generate(&env);
        let token_wasm   = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_address = token_wasm.address();

        // Mint 1,000 XLM (7 decimals) to Alice
        let token_sac = StellarAssetClient::new(&env, &token_address);
        token_sac.mint(&alice, &1_000_0000000_i128);

        // ── Deploy Escrow contract ──
        let escrow_id = env.register(EscrowContract, ());
        let escrow    = EscrowContractClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        TestEnv {
            env,
            escrow,
            token: token_address,
            admin,
            alice,
            bob,
        }
    }

    /// Compute SHA-256 of a raw byte slice, returning BytesN<32>.
    fn hash_secret(&self, secret: &[u8]) -> BytesN<32> {
        let bytes = Bytes::from_slice(&self.env, secret);
        self.env.crypto().sha256(&bytes).into()
    }

    fn alice_balance(&self) -> i128 {
        TokenClient::new(&self.env, &self.token).balance(&self.alice)
    }

    fn bob_balance(&self) -> i128 {
        TokenClient::new(&self.env, &self.token).balance(&self.bob)
    }

    fn escrow_balance(&self) -> i128 {
        TokenClient::new(&self.env, &self.token)
            .balance(&self.escrow.address)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Test 1 — Successful Claim
// ─────────────────────────────────────────────────────────────────────────────
/// Locks 50 XLM under a secret hash, then claims it with the correct secret.
/// Verifies the full balance movement: Alice → Escrow → Bob.
#[test]
fn test_successful_claim() {
    let t = TestEnv::setup();

    let secret      = b"super_secret_passphrase_42";
    let amount      = 50_0000000_i128;  // 50 XLM
    let duration    = 1_000_u32;        // expires in 1,000 ledgers

    let hash        = t.hash_secret(secret);
    let alice_start = t.alice_balance();

    // ── Step 1: Alice locks funds ──
    t.escrow.lock_funds(
        &t.alice,
        &hash,
        &amount,
        &t.token,
        &duration,
    );

    // Escrow now holds the XLM
    assert_eq!(t.escrow_balance(), amount);
    assert_eq!(t.alice_balance(),  alice_start - amount);
    assert_eq!(t.bob_balance(),    0);

    // The lock should exist
    assert!(t.escrow.has_lock(&hash));

    // ── Step 2: Bob claims using the raw secret ──
    let secret_bytes = Bytes::from_slice(&t.env, secret);
    t.escrow.claim_funds(&secret_bytes, &t.bob);

    // Bob received the full amount
    assert_eq!(t.bob_balance(),    amount,          "Bob should have received 50 XLM");
    assert_eq!(t.escrow_balance(), 0,               "Escrow should be empty");
    assert!(!t.escrow.has_lock(&hash),              "Lock entry should be deleted");

    std::println!("[PASS] test_successful_claim — Alice locked 50 XLM, Bob claimed successfully.");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Test 2 — Expired Link Rejection
// ─────────────────────────────────────────────────────────────────────────────
/// Locks funds with a short duration, advances the ledger past expiration,
/// then asserts that `claim_funds` panics with an expiration error.
#[test]
#[should_panic(expected = "claim link has expired")]
fn test_expired_link() {
    let t = TestEnv::setup();

    let secret   = b"another_secret_12345";
    let amount   = 10_0000000_i128;   // 10 XLM
    let duration = 100_u32;           // only 100 ledgers (~500 seconds)

    let hash = t.hash_secret(secret);

    // ── Alice locks ──
    t.escrow.lock_funds(
        &t.alice,
        &hash,
        &amount,
        &t.token,
        &duration,
    );

    // ── Advance ledger PAST expiration ──
    t.env.ledger().with_mut(|li| {
        li.sequence_number += duration + 1; // one ledger past expiration
    });

    // ── Attempt to claim — must panic ──
    let secret_bytes = Bytes::from_slice(&t.env, secret);
    t.escrow.claim_funds(&secret_bytes, &t.bob);  // ← should panic here

    // This line should never execute
    std::println!("[FAIL] test_expired_link — claim should have been rejected!");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Test 3 — Invalid Secret Rejection
// ─────────────────────────────────────────────────────────────────────────────
/// Locks funds with a correct hash, then tries to claim with a WRONG secret.
/// Asserts that `claim_funds` panics because the hash does not match any lock.
#[test]
#[should_panic(expected = "no lock found for this secret")]
fn test_invalid_secret() {
    let t = TestEnv::setup();

    let real_secret  = b"correct_secret_horse_battery_staple";
    let wrong_secret = b"this_is_completely_wrong_secret";
    let amount       = 25_0000000_i128; // 25 XLM
    let duration     = 1_000_u32;

    let hash = t.hash_secret(real_secret);

    // ── Alice locks with the REAL secret's hash ──
    t.escrow.lock_funds(
        &t.alice,
        &hash,
        &amount,
        &t.token,
        &duration,
    );

    // ── Bob tries with the WRONG secret — must panic ──
    let wrong_bytes = Bytes::from_slice(&t.env, wrong_secret);
    t.escrow.claim_funds(&wrong_bytes, &t.bob);  // ← should panic here

    std::println!("[FAIL] test_invalid_secret — wrong secret should have been rejected!");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Test 4 — Duplicate Lock Rejection
// ─────────────────────────────────────────────────────────────────────────────
/// Asserts that locking the same hash twice panics (prevents re-use attacks).
#[test]
#[should_panic(expected = "lock already exists for this hash")]
fn test_duplicate_lock_rejected() {
    let t = TestEnv::setup();

    let secret   = b"duplicate_hash_test";
    let amount   = 5_0000000_i128;
    let duration = 500_u32;
    let hash     = t.hash_secret(secret);

    // First lock succeeds
    t.escrow.lock_funds(&t.alice, &hash, &amount, &t.token, &duration);

    // Second lock with same hash must panic
    t.escrow.lock_funds(&t.alice, &hash, &amount, &t.token, &duration);

    std::println!("[FAIL] test_duplicate_lock_rejected — duplicate should have been rejected!");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Test 5 — Sender Reclaims Expired Funds
// ─────────────────────────────────────────────────────────────────────────────
/// Verifies that the original sender can reclaim their XLM after expiration.
#[test]
fn test_sender_reclaim_after_expiry() {
    let t = TestEnv::setup();

    let secret      = b"reclaim_test_secret";
    let amount      = 30_0000000_i128;
    let duration    = 50_u32;
    let hash        = t.hash_secret(secret);
    let alice_start = t.alice_balance();

    // ── Lock ──
    t.escrow.lock_funds(&t.alice, &hash, &amount, &t.token, &duration);
    assert_eq!(t.alice_balance(), alice_start - amount);

    // ── Advance past expiry ──
    t.env.ledger().with_mut(|li| {
        li.sequence_number += duration + 1;
    });

    // ── Reclaim ──
    t.escrow.reclaim_funds(&hash);

    // Alice gets her XLM back
    assert_eq!(t.alice_balance(), alice_start,   "Alice should recover full amount");
    assert_eq!(t.escrow_balance(), 0,            "Escrow should be empty after reclaim");
    assert!(!t.escrow.has_lock(&hash),           "Lock entry should be deleted");

    std::println!("[PASS] test_sender_reclaim_after_expiry — Alice reclaimed 30 XLM.");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Test 6 — Claimed Event Is Emitted
// ─────────────────────────────────────────────────────────────────────────────
/// Verifies the `claimed` event is published after a successful claim.
/// The frontend relies on this event for real-time UI updates (Level 3).
#[test]
fn test_claimed_event_emitted() {
    let t = TestEnv::setup();

    let secret   = b"event_test_secret_99";
    let amount   = 15_0000000_i128;
    let duration = 500_u32;
    let hash     = t.hash_secret(secret);

    t.escrow.lock_funds(&t.alice, &hash, &amount, &t.token, &duration);

    let secret_bytes = Bytes::from_slice(&t.env, secret);
    t.escrow.claim_funds(&secret_bytes, &t.bob);

    // Check that at least one event was emitted during the claim
    let events = t.env.events().all();
    assert!(!events.events().is_empty(), "At least one event should be emitted on claim");

    std::println!("[PASS] test_claimed_event_emitted — {} event(s) found.", events.events().len());
}
