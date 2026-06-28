/**
 * lib/stellar.ts
 *
 * Stellar SDK helpers for the BeamAuth relayer.
 *
 * Responsibilities:
 *  1. Initialize the Soroban RPC client for Testnet.
 *  2. Build a composite transaction that calls Factory.deploy_wallet()
 *     and Escrow.claim_funds() atomically.
 *  3. Wrap the inner transaction in a FeeBumpTransaction so the relayer
 *     pays the gas — the new user pays zero XLM.
 */

import {
  Contract,
  Keypair,
  Networks,
  rpc as StellarRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";

// ─────────────────────────────────────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────────────────────────────────────

const NETWORK_PASSPHRASE  = Networks.TESTNET;
const RPC_URL             = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const ESCROW_CONTRACT_ID  = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID  ?? "";
const FACTORY_CONTRACT_ID = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID ?? "";
const RELAYER_SECRET_KEY  = process.env.RELAYER_SECRET_KEY ?? "";

// Fee-Bump base fee: 10x the inner transaction base fee to ensure priority
const FEE_BUMP_BASE_FEE = (parseInt(BASE_FEE) * 10).toString();

// ─────────────────────────────────────────────────────────────────────────────
//  RPC Client singleton
// ─────────────────────────────────────────────────────────────────────────────

let _rpcServer: StellarRpc.Server | null = null;

export function getRpcServer(): StellarRpc.Server {
  if (!_rpcServer) {
    _rpcServer = new StellarRpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });
  }
  return _rpcServer;
}

export function getRelayerKeypair(): Keypair {
  if (!RELAYER_SECRET_KEY) throw new Error("RELAYER_SECRET_KEY not set in environment");
  return Keypair.fromSecret(RELAYER_SECRET_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RelayParams {
  /** Raw secret bytes as hex string (pre-image of the escrow hash) */
  secretHex: string;
  /** 64-byte uncompressed secp256r1 public key as hex string */
  publicKeyHex: string;
  /** Raw 64-byte r||s ECDSA signature as hex string */
  signatureHex: string;
}

export interface RelayResult {
  txHash:        string;
  walletAddress: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Build the claim transaction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds, simulates, and submits a Fee-Bump transaction that:
 *   1. Calls Factory.deploy_wallet(pub_key) → deploys the Passkey Smart Wallet
 *   2. Calls Escrow.claim_funds(secret, wallet_address) → releases native XLM
 *
 * The outer Fee-Bump is signed by the relayer keypair so the new user
 * pays zero network fees.
 *
 * @returns txHash and the newly deployed wallet address
 */
export async function buildAndSubmitClaimTx(
  params: RelayParams
): Promise<RelayResult> {
  const server  = getRpcServer();
  const relayer = getRelayerKeypair();

  // ── Load relayer account from ledger ──────────────────────────────────────
  const account = await server.getAccount(relayer.publicKey());

  // ── Hex → Buffers ─────────────────────────────────────────────────────────
  const secretBytes = Buffer.from(params.secretHex, "hex");
  const pubKeyBytes = Buffer.from(params.publicKeyHex, "hex");

  // ── Build the inner transaction ───────────────────────────────────────────
  const escrowContract  = new Contract(ESCROW_CONTRACT_ID);
  const factoryContract = new Contract(FACTORY_CONTRACT_ID);

  // Convert bytes to ScVal
  const pubKeyScVal = nativeToScVal(pubKeyBytes, { type: "bytes" });
  const secretScVal = nativeToScVal(secretBytes, { type: "bytes" });

  // Step 1: deploy_wallet(pub_key)
  const deployOp = factoryContract.call(
    "deploy_wallet",
    pubKeyScVal,
  );

  // Simulate deploy-only tx to get the wallet address from return value
  const simTxBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(deployOp)
    .setTimeout(30);

  const simTx     = simTxBuilder.build();
  const simResult = await server.simulateTransaction(simTx);

  if (StellarRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Wallet deploy simulation failed: ${(simResult as StellarRpc.Api.SimulateTransactionErrorResponse).error}`);
  }

  const walletAddress = extractAddressFromSimulation(
    simResult as StellarRpc.Api.SimulateTransactionSuccessResponse
  );

  // Step 2: claim_funds(secret, walletAddress)
  const claimOp = escrowContract.call(
    "claim_funds",
    secretScVal,
    new Address(walletAddress).toScVal(),
  );

  // Build final composite transaction with both operations
  const finalTxBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(deployOp)
    .addOperation(claimOp)
    .setTimeout(30);

  const finalTx     = finalTxBuilder.build();
  const preparedTx  = await server.prepareTransaction(finalTx);

  // Sign the inner transaction
  preparedTx.sign(relayer);

  // ── Wrap in Fee-Bump transaction ──────────────────────────────────────────
  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    relayer,
    FEE_BUMP_BASE_FEE,
    preparedTx,
    NETWORK_PASSPHRASE,
  );
  feeBumpTx.sign(relayer);

  // ── Submit ────────────────────────────────────────────────────────────────
  const response = await server.sendTransaction(feeBumpTx);

  if (response.status === "ERROR") {
    throw new Error(`Transaction rejected: ${JSON.stringify(response.errorResult)}`);
  }

  // ── Poll for confirmation ─────────────────────────────────────────────────
  const txHash = response.hash;
  await pollForConfirmation(server, txHash);

  return { txHash, walletAddress };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Event streaming: listen for 'claimed' event
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Polls the Stellar RPC for the 'claimed' contract event emitted by EscrowVault.
 * Used by the frontend StatusPoller to update the UI from "Pending" to "Success".
 */
export async function watchForClaimedEvent(
  fromLedger: number,
  onClaimed:  (walletAddress: string, amount: string) => void,
  maxRetries  = 30,
): Promise<void> {
  const server = getRpcServer();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await sleep(2000);

    try {
      const response = await server.getEvents({
        startLedger: fromLedger,
        filters: [
          {
            type:        "contract",
            contractIds: [ESCROW_CONTRACT_ID],
            topics:      [["AAAADgAAAAdjbGFpbWVkAAAAAAA="]], // "claimed" symbol XDR
          },
        ],
        limit: 10,
      });

      if (response.events.length > 0) {
        const event  = response.events[0];
        const data   = event.value;
        const amount = data.vec()?.[1]?.i128()?.toString() ?? "unknown";
        onClaimed(event.contractId ? event.contractId.toString() : "", amount);
        return;
      }
    } catch {
      // RPC node may not have indexed the ledger yet — retry
    }
  }

  throw new Error("Timed out waiting for claimed event (60s)");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function pollForConfirmation(
  server:  StellarRpc.Server,
  txHash:  string,
  retries  = 20,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    await sleep(1500 + i * 200);
    const result = await server.getTransaction(txHash);
    if (result.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) return;
    if (result.status === StellarRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction ${txHash} failed on Stellar network`);
    }
  }
  throw new Error(`Transaction ${txHash} unconfirmed after ${retries} polls`);
}

function extractAddressFromSimulation(
  simulation: StellarRpc.Api.SimulateTransactionSuccessResponse
): string {
  const retval = simulation.result?.retval;
  if (!retval) throw new Error("Factory simulation returned no value");
  return Address.fromScVal(retval).toString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
