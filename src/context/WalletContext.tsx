"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface WalletContextType {
  walletAddress: string | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

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
    try {
      const { isConnected, setAllowed, getAddress } = await import("@stellar/freighter-api");
      const connected = await isConnected();
      if (!connected) {
        alert("Freighter browser extension is not installed. Please install it to connect.");
        return;
      }

      await setAllowed();
      const { address, error } = await getAddress();
      if (error) {
        console.error("Freighter connection error:", error);
        return;
      }

      if (address) {
        setWalletAddress(address);
      }
    } catch (err) {
      console.error("Failed to connect Freighter:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, connecting, connectWallet, disconnectWallet }}>
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
