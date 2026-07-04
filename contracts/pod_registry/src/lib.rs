//! # BeamAuth — Proof of Device (PoD) Registry Contract
//!
//! Registers and verifies hardware-bound WebAuthn passkeys natively on the Stellar
//! blockchain to construct a Sybil-resistant identity map.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Bytes, BytesN, Env,
};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct DeviceRecord {
    /// Owner's uncompressed 65-byte secp256r1 public key (0x04 || x || y)
    pub public_key: BytesN<65>,
    /// Ledger time (unix timestamp) when registered
    pub registration_time: u64,
    /// 1 = Active, 2 = Revoked
    pub status: u32,
}

#[contracttype]
pub enum DataKey {
    /// Maps Address -> DeviceRecord
    Device(Address),
}

#[contract]
pub struct PodRegistry;

#[contractimpl]
impl PodRegistry {
    /// Registers a hardware device passkey for a user.
    ///
    /// Requires authentication of the user's address. Verifies that the provided
    /// signature is valid for the message under the public key using secp256r1.
    pub fn register_device(
        env: Env,
        user: Address,
        public_key: BytesN<65>,
        message: Bytes,
        signature: BytesN<64>,
    ) {
        user.require_auth();

        // 1. Compute the cryptographic hash of the message securely on-chain.
        let message_digest = env.crypto().sha256(&message);

        // 2. Verify the signature natively using the host's secp256r1_verify function.
        // If the signature is invalid, this function will panic/trap.
        env.crypto().secp256r1_verify(&public_key, &message_digest, &signature);

        // 2. Store the device record mapping user Address -> DeviceRecord.
        let record = DeviceRecord {
            public_key,
            registration_time: env.ledger().timestamp(),
            status: 1, // Active
        };

        let key = DataKey::Device(user);
        env.storage().persistent().set(&key, &record);
    }

    /// Read-only check to see if a user has a registered active hardware device.
    pub fn is_verified_human(env: Env, user: Address) -> bool {
        let key = DataKey::Device(user);
        if let Some(record) = env.storage().persistent().get::<DataKey, DeviceRecord>(&key) {
            record.status == 1 // Active
        } else {
            false
        }
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
        Address, Bytes, BytesN, Env,
    };

    #[test]
    fn test_unregistered_is_not_verified() {
        let env = Env::default();
        let contract_id = env.register(PodRegistry, ());
        let client = PodRegistryClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        assert!(!client.is_verified_human(&user));
    }

    #[test]
    #[should_panic]
    fn test_register_device_invalid_signature_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(PodRegistry, ());
        let client = PodRegistryClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        let dummy_pubkey = BytesN::<65>::from_array(&env, &[0u8; 65]);
        let dummy_message = Bytes::from_array(&env, &[0u8; 32]);
        let dummy_sig = BytesN::<64>::from_array(&env, &[0u8; 64]);

        client.register_device(&user, &dummy_pubkey, &dummy_message, &dummy_sig);
    }
}
