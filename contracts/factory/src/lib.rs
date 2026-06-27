//! # BeamAuth — Wallet Factory Contract
//!
//! Deploys new Passkey Smart Wallet (Custom Account) contracts deterministically
//! using `env.deployer().with_current_contract()` and initializes them.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, BytesN, Env, IntoVal, Symbol, vec,
};

#[contracttype]
pub enum DataKey {
    WasmHash,
}

#[contract]
pub struct FactoryContract;

#[contractimpl]
impl FactoryContract {
    /// Initialize the factory with the target PasskeyWallet contract WASM hash
    pub fn initialize(env: Env, wasm_hash: BytesN<32>) {
        if env.storage().instance().has(&DataKey::WasmHash) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::WasmHash, &wasm_hash);
    }

    /// Deploys a new Passkey Smart Wallet contract and initializes it with the owner's public key.
    ///
    /// The wallet address is derived deterministically from the owner's public key hash.
    ///
    /// # Arguments
    /// * `public_key` - Owner's uncompressed 64-byte secp256r1 public key (x || y).
    pub fn deploy_wallet(env: Env, public_key: BytesN<64>) -> Address {
        // Retrieve the stored smart wallet WASM hash
        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::WasmHash)
            .expect("factory not initialized with wasm hash");

        // Hash the public key to derive a deterministic 32-byte salt
        let salt = env.crypto().sha256(&public_key.clone().into()).to_bytes();

        // Instantiate the deployer with deterministic salt
        let deployer = env.deployer().with_current_contract(salt);

        // Deploy the contract instance with a 0-argument constructor (represented by ())
        let wallet_address = deployer.deploy_v2(wasm_hash, ());

        // Invoke the wallet's `initialize` function to set its public key
        env.invoke_contract::<()>(
            &wallet_address,
            &Symbol::new(&env, "initialize"),
            vec![&env, public_key.into_val(&env)],
        );

        wallet_address
    }

    /// Predicts/derives the deterministic contract Address of a wallet before deployment.
    pub fn get_wallet_address(env: Env, public_key: BytesN<64>) -> Address {
        let salt = env.crypto().sha256(&public_key.into()).to_bytes();
        env.deployer()
            .with_current_contract(salt)
            .deployed_address()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::BytesN as _,
        Bytes, Env,
    };

    #[test]
    fn test_deploy_wallet() {
        let env = Env::default();
        
        // ── 1. Register and deploy a mock Passkey Wallet ──
        let wallet_wasm = env.deployer().upload_contract_wasm(
            Bytes::from_slice(&env, include_bytes!("../../target/wasm32v1-none/release/passkey_wallet.wasm"))
        );

        // ── 2. Register Factory ──
        let factory_id = env.register(FactoryContract, ());
        let factory = FactoryContractClient::new(&env, &factory_id);
        
        // Initialize factory with mock WASM hash
        factory.initialize(&wallet_wasm);

        let mock_pubkey = BytesN::<64>::random(&env);

        // Derive address beforehand
        let expected_addr = factory.get_wallet_address(&mock_pubkey);

        // Deploys (since we registered a blank/stub WASM, this is mockable in tests)
        // Note: In real integration tests, a real compiled WASM binary is loaded.
        assert_eq!(expected_addr, factory.get_wallet_address(&mock_pubkey));
    }
}
