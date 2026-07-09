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

function getValidContractId(envVal: string | undefined, fallback: string): string {
  const val = (envVal || "").trim();
  if (val.startsWith("C") && val.length === 56) return val;
  return fallback;
}

export const NETWORK_PASSPHRASE  = Networks.TESTNET;
const RPC_URL             = (process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org").trim();
const ESCROW_CONTRACT_ID  = getValidContractId(process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID, "CAH7SZBIBQPH7E57UOU5MFR6V2VQBROBTMVPJ2MOUCRP7H7NSRIFRDCV");
const FACTORY_CONTRACT_ID = getValidContractId(process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID, "CCDV672F6FHX4G7FUV7Z4CJNPVAMR445QO6BR2BDKS44YBQET6UJFAX3");
const RELAYER_SECRET_KEY  = (process.env.RELAYER_SECRET_KEY  || "SCYIG655TWYKQJAHDD7QV5WSQQI2ILUDN26QYBPWI5EMQF7PT5HHBGU2").trim();

export { BASE_FEE };
// Fee-Bump base fee: 10x the inner transaction base fee to ensure priority
export const FEE_BUMP_BASE_FEE = (parseInt(BASE_FEE) * 10).toString();

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
async function prepareAndSubmitWithRetry(
  server: StellarRpc.Server,
  relayer: Keypair,
  txBuilderFn: (account: Awaited<ReturnType<StellarRpc.Server["getAccount"]>>) => Promise<TransactionBuilder> | TransactionBuilder,
  maxRetries = 4
): Promise<string> {
  let lastError: Error | unknown = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const account = await server.getAccount(relayer.publicKey());
      const txBuilder = await txBuilderFn(account);
      const tx = txBuilder.build();

      const preparedTx = await server.prepareTransaction(tx);
      preparedTx.sign(relayer);

      const feeBump = TransactionBuilder.buildFeeBumpTransaction(
        relayer,
        FEE_BUMP_BASE_FEE,
        preparedTx,
        NETWORK_PASSPHRASE,
      );
      feeBump.sign(relayer);

      const response = await server.sendTransaction(feeBump);
      if (response.status === "ERROR") {
        const errorResultStr = JSON.stringify(response.errorResult);
        if (errorResultStr.includes("txBadSeq") || errorResultStr.includes("-5")) {
          console.warn(`[relay] txBadSeq detected (sendTransaction) on attempt ${attempt + 1}. Retrying in 2.5s...`);
          lastError = new Error(`Transaction failed: ${errorResultStr}`);
          await sleep(2500);
          continue;
        }
        throw new Error(`Transaction rejected: ${errorResultStr}`);
      }

      const txHash = response.hash;
      await pollForConfirmation(server, txHash);
      return txHash;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err || "");
      if (errMsg.includes("txBadSeq") || errMsg.includes("-5")) {
        console.warn(`[relay] txBadSeq detected (exception) on attempt ${attempt + 1}. Retrying in 2.5s...`);
        lastError = err;
        await sleep(2500);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Transaction submission failed after maximum retries due to sequence number mismatch.");
}

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

  // ── Derive deterministic wallet address ───────────────────────────────────
  const getAddrOp = factoryContract.call(
    "get_wallet_address",
    pubKeyScVal,
  );

  const simGetAddrBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(getAddrOp)
    .setTimeout(30);

  const simGetAddrTx = simGetAddrBuilder.build();
  const simGetAddrRes = await server.simulateTransaction(simGetAddrTx);

  if (StellarRpc.Api.isSimulationError(simGetAddrRes)) {
    throw new Error(`Wallet address derivation failed: ${(simGetAddrRes as StellarRpc.Api.SimulateTransactionErrorResponse).error}`);
  }

  const walletAddress = extractAddressFromSimulation(
    simGetAddrRes as StellarRpc.Api.SimulateTransactionSuccessResponse
  );

  // ── Check if the wallet contract is already deployed ─────────────────────
  let isDeployed = false;
  try {
    const walletContract = new Contract(walletAddress);
    const getPubKeyOp = walletContract.call("get_public_key");
    const checkTxBuilder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(getPubKeyOp)
      .setTimeout(30);
    const checkTx = checkTxBuilder.build();
    const checkSim = await server.simulateTransaction(checkTx);
    if (!StellarRpc.Api.isSimulationError(checkSim)) {
      isDeployed = true;
    }
  } catch {
    isDeployed = false;
  }

  console.log(`[relay] Wallet status for ${walletAddress}: ${isDeployed ? "already deployed" : "not deployed"}`);

  // ── Step 1: Execute deploy_wallet transaction if NOT deployed ──────────────
  if (!isDeployed) {
    await prepareAndSubmitWithRetry(server, relayer, (acc) => {
      const deployOp = factoryContract.call(
        "deploy_wallet",
        pubKeyScVal,
      );
      return new TransactionBuilder(acc, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(deployOp)
        .setTimeout(30);
    });
  }

  // ── Step 2: Execute claim_funds transaction ───────────────────────────────
  const txHash = await prepareAndSubmitWithRetry(server, relayer, (acc) => {
    const claimOp = escrowContract.call(
      "claim_funds",
      secretScVal,
      new Address(walletAddress.trim()).toScVal(),
    );
    return new TransactionBuilder(acc, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(claimOp)
      .setTimeout(30);
  });

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
            topics:      [["AAAADwAAAAdjbGFpbWVkAA=="]], // "claimed" symbol XDR
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
