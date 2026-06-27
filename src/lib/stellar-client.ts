import {
  Contract,
  Address,
  rpc as StellarRpc,
  TransactionBuilder,
  Account,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Transaction,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const USDC_ID = process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const ESCROW_ID = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

/**
 * Helper to get a configured Soroban RPC Server instance.
 */
export function getClientRpcServer(): StellarRpc.Server {
  return new StellarRpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });
}

/**
 * Queries the USDC balance of a given account address on Testnet.
 * Decimals are assumed to be 7 (Stellar native USDC standard).
 */
export async function getUsdcBalance(walletAddr: string): Promise<string> {
  try {
    const server = getClientRpcServer();
    const tokenContract = new Contract(USDC_ID);

    // Build a mock transaction to simulate the read-only balance call
    const dummyAccount = new Account(walletAddr, "0");
    const op = tokenContract.call("balance", new Address(walletAddr).toScVal());

    const tx = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    
    if (StellarRpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const balanceVal = scValToNative(sim.result.retval);
      const balanceBigInt = BigInt(balanceVal.toString());
      return (Number(balanceBigInt) / 10_000_000).toFixed(2);
    }
    return "0.00";
  } catch (err) {
    console.error("Failed to fetch USDC balance:", err);
    return "0.00";
  }
}

/**
 * Builds and prepares the lock_funds transaction to be signed by Freighter.
 * 
 * @param walletAddr - Connected Freighter wallet address (sender)
 * @param secretString - The secret key used to lock the escrow
 * @param amountUsdc - The amount of USDC to lock (e.g. "1.5")
 * @param durationLedgers - The escrow validity period in ledgers (default 17280 ≈ 24h)
 * @returns Base64 XDR string of the prepared transaction
 */
export async function buildLockFundsTx(
  walletAddr: string,
  secretString: string,
  amountUsdc: string,
  durationLedgers: number = 17280
): Promise<string> {
  const server = getClientRpcServer();
  const escrowContract = new Contract(ESCROW_ID);

  // Retrieve sender account sequence
  const account = await server.getAccount(walletAddr);

  // Compute SHA-256 hash of the secret string
  const secretBytes = new TextEncoder().encode(secretString);
  const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  const hashScVal = nativeToScVal(new Uint8Array(secretHashBuffer), { type: "bytes" });

  // Convert amount to base units (7 decimals)
  const amountBase = BigInt(Math.round(parseFloat(amountUsdc) * 10_000_000));
  const amountScVal = nativeToScVal(amountBase, { type: "i128" });

  const tokenScVal = new Address(USDC_ID).toScVal();
  const senderScVal = new Address(walletAddr).toScVal();
  const durationScVal = nativeToScVal(durationLedgers, { type: "u32" });

  // Build the escrow.lock_funds operation
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

  // Prepare transaction (populates footprint/auth using simulation)
  const preparedTx = await server.prepareTransaction(tx);
  return preparedTx.toXDR();
}

/**
 * Submits a signed XDR transaction to Stellar and polls for confirmation.
 */
export async function submitSignedTx(signedXdr: string): Promise<string> {
  const server = getClientRpcServer();
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  
  const response = await server.sendTransaction(tx);
  if (response.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${JSON.stringify(response.errorResult)}`);
  }

  // Poll for completion
  const txHash = response.hash;
  let retries = 30;

  while (retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const txResponse = await server.getTransaction(txHash);
    
    if (txResponse.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
      return txHash;
    }
    if (txResponse.status === StellarRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction execution failed: transaction status is FAILED`);
    }
    retries--;
  }

  throw new Error("Transaction polling timed out");
}
