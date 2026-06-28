"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface WalletContextType {
  walletAddress: string | null;
  connecting: boolean;
  connectionError: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  clearConnectionError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check if wallet is already authorized and connected on mount
  useEffect(() => {
    async function checkExistingConnection() {
      try {
        const { isConnected, getAddress } = await import("@stellar/freighter-api");
        const connected = await isConnected();
        if (connected) {
          // Verify if user already allowed the app and has an address
          const { address, error } = await getAddress();
          if (address && !error) {
            setWalletAddress(address);
          }
        }
      } catch (err) {
        console.error("Error checking Freighter connection on mount:", err);
      }
    }
    checkExistingConnection();
  }, []);

  // Poll for account switches / lock state changes in Freighter
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(async () => {
      try {
        const { getAddress } = await import("@stellar/freighter-api");
        const { address, error } = await getAddress();
        if (error || !address) {
          // Wallet was locked or disconnected
          setWalletAddress(null);
        } else if (address !== walletAddress) {
          // Account was switched
          setWalletAddress(address);
        }
      } catch (err) {
        console.error("Error polling Freighter address:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [walletAddress]);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    setConnectionError(null);
    try {
      const { isConnected, setAllowed, getAddress } = await import("@stellar/freighter-api");
      const connected = await isConnected();
      if (!connected) {
        setConnectionError("Freighter browser extension is not installed. Please install it to connect.");
        return;
      }

      try {
        await setAllowed();
      } catch (allowErr) {
        // User rejected the Freighter connection popup
        setConnectionError("Wallet connection was rejected. Please try again.");
        console.warn("Freighter setAllowed rejected:", allowErr);
        return;
      }

      const { address, error } = await getAddress();
      if (error) {
        setConnectionError(`Freighter error: ${error}`);
        console.error("Freighter connection error:", error);
        return;
      }

      if (address) {
        setWalletAddress(address);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet.";
      setConnectionError(message);
      console.error("Failed to connect Freighter:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setConnectionError(null);
  }, []);

  const clearConnectionError = useCallback(() => {
    setConnectionError(null);
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, connecting, connectionError, connectWallet, disconnectWallet, clearConnectionError }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
