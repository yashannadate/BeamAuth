//! # BeamAuth — Passkey Smart Wallet (Custom Account Contract)
//!
//! Implements Soroban's CustomAccountInterface trait (__check_auth) to verify
//! secp256r1 ECDSA signatures (WebAuthn Passkeys) natively on-chain.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    auth::{CustomAccountInterface, Context},
    BytesN, Env, Error, Vec, crypto::Hash,
};

#[contracttype]
pub enum DataKey {
    PublicKey,
}

#[contracttype]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum WalletError {
    NotInitialized     = 101,
    AlreadyInitialized = 102,
    InvalidSignatureLength = 103,
}

#[contract]
pub struct PasskeyWallet;

#[contractimpl]
impl PasskeyWallet {
    /// Initialize the wallet with the owner's uncompressed 64-byte secp256r1 public key (x || y)
    pub fn initialize(env: Env, public_key: BytesN<64>) {
        if env.storage().instance().has(&DataKey::PublicKey) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::PublicKey, &public_key);
    }

    /// Helper to get the registered public key
    pub fn get_public_key(env: Env) -> BytesN<64> {
        env.storage()
            .instance()
            .get(&DataKey::PublicKey)
            .unwrap_or_else(|| panic!("not initialized"))
    }
}

#[contractimpl]
impl CustomAccountInterface for PasskeyWallet {
    type Signature = BytesN<64>;
    type Error = Error;

    /// Verifies the Passkey signature against the stored public key.
    ///
    /// # Arguments
    /// * `signature_payload` - The 32-byte hash computed by the host representing the authorized action.
    /// * `signatures`        - The raw 64-byte ECDSA signature (r || s).
    /// * `_auth_contexts`     - Context parameters of the authorized calls.
    fn __check_auth(
        env: Env,
        signature_payload: Hash<32>,
        signatures: BytesN<64>,
        _auth_contexts: Vec<Context>,
    ) -> Result<(), Self::Error> {
        // Retrieve stored public key
        let public_key: BytesN<64> = env
            .storage()
            .instance()
            .get(&DataKey::PublicKey)
            .ok_or_else(|| Error::from_contract_error(WalletError::NotInitialized as u32))?;

        // Convert the 64-byte public key (x || y) to 65-byte SEC-1 uncompressed format (0x04 || x || y)
        let mut sec1_key = [0u8; 65];
        sec1_key[0] = 0x04;
        sec1_key[1..65].copy_from_slice(&public_key.to_array());
        let sec1_pubkey = BytesN::from_array(&env, &sec1_key);

        // Verify the ECDSA secp256r1 signature using Soroban hazmat host function
        env.crypto().secp256r1_verify(&sec1_pubkey, &signature_payload, &signatures);

        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, BytesN as _},
        Address, Env,
    };

    #[test]
    fn test_initialize_and_get_key() {
        let env = Env::default();
        let contract_id = env.register(PasskeyWallet, ());
        let client = PasskeyWalletClient::new(&env, &contract_id);

        let mock_key = BytesN::<64>::random(&env);
        client.initialize(&mock_key);

        assert_eq!(client.get_public_key(), mock_key);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_cannot_double_initialize() {
        let env = Env::default();
        let contract_id = env.register(PasskeyWallet, ());
        let client = PasskeyWalletClient::new(&env, &contract_id);

        let key1 = BytesN::<64>::random(&env);
        let key2 = BytesN::<64>::random(&env);

        client.initialize(&key1);
        client.initialize(&key2);
    }
}
