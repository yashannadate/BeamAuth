import {
  Contract,
  Address,
  Horizon,
  rpc as StellarRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
} from "@stellar/stellar-sdk";

const RPC_URL = (process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org").trim();
const HORIZON_URL = (process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org").trim();

function getValidContractId(envVal: string | undefined, fallback: string): string {
  const val = (envVal || "").trim();
  if (val.startsWith("C") && val.length === 56) return val;
  return fallback;
}

/** Official Stellar Native Asset (XLM) contract on Soroban testnet/mainnet. */
export const NATIVE_ASSET_CONTRACT_ID = getValidContractId(
  process.env.NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID,
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
);

const ESCROW_ID = getValidContractId(
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID,
  "CAH7SZBIBQPH7E57UOU5MFR6V2VQBROBTMVPJ2MOUCRP7H7NSRIFRDCV"
);
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

/** XLM uses 7 decimal places (stroops) on Soroban. */
const XLM_DECIMALS = 7;
const XLM_SCALE = 10 ** XLM_DECIMALS;

export function getClientRpcServer(): StellarRpc.Server {
  return new StellarRpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });
}

function getHorizonServer(): Horizon.Server {
  return new Horizon.Server(HORIZON_URL);
}

/**
 * Queries native XLM balance via the Horizon API.
 *
 * Uses `server.loadAccount(publicKey)` and looks for the balance entry
 * where `asset_type === 'native'`.  This avoids the "Unsupported address
 * type" error that occurred when the XLM Contract ID (C…) was fed into
 * classic SDK helpers that expect an Ed25519 public key (G…).
 */
export async function getXlmBalance(walletAddr: string): Promise<string> {
  try {
    const horizon = getHorizonServer();
    const account = await horizon.loadAccount(walletAddr.trim());

    const nativeEntry = account.balances.find(
      (b: Horizon.HorizonApi.BalanceLine) => b.asset_type === "native"
    );

    if (nativeEntry) {
      return parseFloat(nativeEntry.balance).toFixed(4);
    }
    return "0";
  } catch (err) {
    console.error("Failed to fetch XLM balance:", err);
    return "0";
  }
}

/**
 * Builds and prepares the lock_funds transaction to be signed by Freighter.
 *
 * @param walletAddr - Connected Freighter wallet address (sender)
 * @param secretString - The secret key used to lock the escrow
 * @param amountXlm - The amount of XLM to lock (e.g. "1.5")
 * @param durationLedgers - The escrow validity period in ledgers (default 17280 ≈ 24h)
 */
export async function buildLockFundsTx(
  walletAddr: string,
  secretString: string,
  amountXlm: string,
  durationLedgers: number = 17280
): Promise<string> {
  const server = getClientRpcServer();
  const cleanWallet = walletAddr.trim();
  const escrowContract = new Contract(ESCROW_ID.trim());

  const account = await server.getAccount(cleanWallet);

  const secretBytes = new TextEncoder().encode(secretString);
  const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  const hashScVal = nativeToScVal(new Uint8Array(secretHashBuffer), { type: "bytes" });

  const amountBase = BigInt(Math.round(parseFloat(amountXlm) * XLM_SCALE));
  const amountScVal = nativeToScVal(amountBase, { type: "i128" });

  const tokenScVal = new Address(NATIVE_ASSET_CONTRACT_ID.trim()).toScVal();
  const senderScVal = new Address(cleanWallet).toScVal();
  const durationScVal = nativeToScVal(durationLedgers, { type: "u32" });

  const lockOp = escrowContract.call(
    "lock_funds",
    senderScVal,
    hashScVal,
    amountScVal,
    tokenScVal,
    durationScVal
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(lockOp)
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  return preparedTx.toXDR();
}

export async function submitSignedTx(signedXdr: string): Promise<string> {
  const server = getClientRpcServer();
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const response = await server.sendTransaction(tx);
  if (response.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${JSON.stringify(response.errorResult)}`);
  }

  const txHash = response.hash;
  const maxRetries = 30;

  for (let i = 0; i < maxRetries; i++) {
    // Progressive backoff: 1s → 1.3s → 1.6s → … (reduces RPC spam)
    await new Promise((resolve) => setTimeout(resolve, 1000 + i * 300));
    const txResponse = await server.getTransaction(txHash);

    if (txResponse.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
      return txHash;
    }
    if (txResponse.status === StellarRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("Transaction execution failed: transaction status is FAILED");
    }
  }

  throw new Error("Transaction polling timed out");
}
