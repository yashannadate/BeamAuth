//! # BeamAuth — Escrow Vault Contract
//!
//! Locks USDC under a SHA-256 hash of a secret.  When the receiver provides
//! the pre-image (the secret), funds are atomically released to their newly
//! deployed Passkey Smart Wallet.
//!
//! ## Storage layout
//! | Key                  | Type          | TTL policy  | Purpose                          |
//! |----------------------|---------------|-------------|----------------------------------|
//! | `Lock(hash)`         | `LockedFunds` | Persistent  | Active escrow record             |
//! | `Admin`              | `Address`     | Instance    | Contract administrator           |
//!
//! ## Security
//! - Funds are moved via the Soroban Token Interface (`transfer`) which is atomic.
//! - The hash pre-image is never stored on-chain; only SHA-256(secret) is.
//! - `lock_funds` requires explicit `sender.require_auth()`.
//! - `claim_funds` verifies hash match AND expiration before any transfer.
//! - Storage entry is deleted post-claim to reclaim rent ledger fees.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    symbol_short, Address, Bytes, BytesN, Env, Symbol, token,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Data Structures
// ─────────────────────────────────────────────────────────────────────────────

/// All state associated with a single escrow lock.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct LockedFunds {
    /// Address of the user who originally locked the funds.
    pub sender: Address,
    /// SAC (Stellar Asset Contract) address of the token being escrowed.
    pub token: Address,
    /// Amount in the token's base unit (e.g., stroops for XLM, 1e-7 USDC units).
    pub amount: i128,
    /// Soroban ledger number after which `claim_funds` will reject the claim.
    pub expiration_ledger: u32,
}

/// Storage key enum — Soroban uses typed keys, not raw strings.
#[contracttype]
pub enum DataKey {
    /// Maps SHA-256(secret) → LockedFunds
    Lock(BytesN<32>),
    /// Stores the contract administrator address
    Admin,
}

// ─────────────────────────────────────────────────────────────────────────────
//  Error Codes
// ─────────────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum EscrowError {
    /// A lock with this hash already exists.
    LockAlreadyExists    = 1,
    /// No lock found for the provided secret's hash.
    LockNotFound         = 2,
    /// The claim window has passed (ledger > expiration_ledger).
    LinkExpired          = 3,
    /// The SHA-256 of the provided secret does not match the stored hash.
    InvalidSecret        = 4,
    /// Amount must be greater than zero.
    InvalidAmount        = 5,
}

// ─────────────────────────────────────────────────────────────────────────────
//  Event Topics
// ─────────────────────────────────────────────────────────────────────────────

/// Emitted when funds are successfully locked.
const LOCKED_EVENT:  Symbol = symbol_short!("locked");
/// Emitted when funds are successfully claimed.
const CLAIMED_EVENT: Symbol = symbol_short!("claimed");
/// Emitted when a sender reclaims expired funds.
const RECLAIMED_EVENT: Symbol = symbol_short!("reclaimed");

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: bump persistent storage TTL
// ─────────────────────────────────────────────────────────────────────────────

/// How long (in ledgers) we keep the escrow entry alive.
/// One ledger ≈ 5 seconds; 2,073,600 ledgers ≈ 120 days.
const PERSISTENT_BUMP_AMOUNT:   u32 = 2_073_600; // ~120 days
const PERSISTENT_BUMP_THRESHOLD: u32 = 1_036_800; // ~60 days

fn bump_lock(env: &Env, key: &DataKey) {
    env.storage().persistent().extend_ttl(
        key,
        PERSISTENT_BUMP_THRESHOLD,
        PERSISTENT_BUMP_AMOUNT,
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Contract
// ─────────────────────────────────────────────────────────────────────────────

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    // ── Initialization ────────────────────────────────────────────────────

    /// Set the contract administrator.  Must be called once during deployment.
    pub fn initialize(env: Env, admin: Address) {
        // Panic if already initialized — prevents re-initialization attacks.
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    // ── Core: lock_funds ─────────────────────────────────────────────────

    /// Lock `amount` of `token` into escrow, keyed by `hash` (SHA-256 of secret).
    ///
    /// # Arguments
    /// * `sender`           — The funding address; must approve this call.
    /// * `hash`             — SHA-256(secret).  32-byte digest produced off-chain.
    /// * `amount`           — Token units to lock (must be > 0).
    /// * `token`            — SAC address of the token (e.g., Testnet USDC).
    /// * `duration_ledgers` — How many ledgers until the link expires (~5s each).
    ///
    /// # Events
    /// Emits `(locked, sender, hash, amount, expiration_ledger)`.
    pub fn lock_funds(
        env:              Env,
        sender:           Address,
        hash:             BytesN<32>,
        amount:           i128,
        token:            Address,
        duration_ledgers: u32,
    ) {
        // --- Auth ---
        // The sender must explicitly approve this contract invocation.
        sender.require_auth();

        // --- Validation ---
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let key = DataKey::Lock(hash.clone());

        // Prevent overwriting an active escrow entry.
        if env.storage().persistent().has(&key) {
            panic!("lock already exists for this hash");
        }

        // --- Compute expiration ---
        let expiration_ledger = env.ledger().sequence() + duration_ledgers;

        // --- Pull tokens from sender into this contract ---
        // The Token Interface is Stellar's canonical SAC ABI.
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        // --- Persist the escrow record ---
        let record = LockedFunds {
            sender:           sender.clone(),
            token:            token.clone(),
            amount,
            expiration_ledger,
        };
        env.storage().persistent().set(&key, &record);
        bump_lock(&env, &key);

        // --- Emit event for frontend real-time listener ---
        env.events().publish(
            (LOCKED_EVENT, sender, hash),
            (amount, expiration_ledger),
        );
    }

    // ── Core: claim_funds ────────────────────────────────────────────────

    /// Release escrowed funds to `recipient` by providing the pre-image `secret`.
    ///
    /// The contract computes SHA-256(`secret`) and compares it to the stored hash.
    /// If they match and the link has not expired, the full locked amount is
    /// transferred to `recipient` (the newly deployed Passkey Smart Wallet).
    ///
    /// # Arguments
    /// * `secret`    — The raw secret bytes whose SHA-256 was passed to `lock_funds`.
    /// * `recipient` — The destination address (Passkey Wallet deployed by Factory).
    ///
    /// # Events
    /// Emits `(claimed, sender, recipient, hash, amount)`.
    pub fn claim_funds(env: Env, secret: Bytes, recipient: Address) {
        // --- Derive hash from the provided secret ---
        let hash: BytesN<32> = env.crypto().sha256(&secret).into();
        let key = DataKey::Lock(hash.clone());

        // --- Load the escrow record ---
        let record: LockedFunds = env
            .storage()
            .persistent()
            .get(&key)
            .expect("no lock found for this secret");

        // --- Check expiration ---
        // Use ledger sequence as a monotonic clock.
        if env.ledger().sequence() > record.expiration_ledger {
            panic!("claim link has expired");
        }

        // --- Transfer tokens to recipient ---
        let token_client = token::Client::new(&env, &record.token);
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &record.amount,
        );

        // --- Remove storage to reclaim rent ---
        env.storage().persistent().remove(&key);

        // --- Emit the 'claimed' event ---
        // The frontend listens for this via stellar-sdk getEvents() to update
        // the UI from "Pending" → "Success" in real-time (Level 3 requirement).
        env.events().publish(
            (CLAIMED_EVENT, record.sender, recipient),
            (hash, record.amount),
        );
    }

    // ── Reclaim expired funds ────────────────────────────────────────────

    /// Allow the original sender to reclaim funds after the link has expired.
    ///
    /// This prevents funds from being locked forever if the recipient never claims.
    pub fn reclaim_funds(env: Env, hash: BytesN<32>) {
        let key = DataKey::Lock(hash.clone());

        let record: LockedFunds = env
            .storage()
            .persistent()
            .get(&key)
            .expect("no lock found for this hash");

        // Only the original sender can reclaim.
        record.sender.require_auth();

        // Must be past expiration.
        if env.ledger().sequence() <= record.expiration_ledger {
            panic!("link has not expired yet");
        }

        // Return funds to sender.
        let token_client = token::Client::new(&env, &record.token);
        token_client.transfer(
            &env.current_contract_address(),
            &record.sender,
            &record.amount,
        );

        env.storage().persistent().remove(&key);

        env.events().publish(
            (RECLAIMED_EVENT, record.sender.clone()),
            (hash, record.amount),
        );
    }

    // ── View functions ───────────────────────────────────────────────────

    /// Returns the full `LockedFunds` record for a given `hash`, or panics.
    pub fn get_lock(env: Env, hash: BytesN<32>) -> LockedFunds {
        let key = DataKey::Lock(hash);
        env.storage()
            .persistent()
            .get(&key)
            .expect("no lock found")
    }

    /// Returns `true` if an active (possibly expired) lock exists for `hash`.
    pub fn has_lock(env: Env, hash: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Lock(hash))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test;
