import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import PhotoProofABI from "../contracts/PhotoProofABI.json";
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX, NETWORK_CONFIG } from "../contracts/contractConfig";

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [isSepolia, setIsSepolia] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet is connected on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0].toLowerCase());
          }
        })
        .catch(console.error);

      window.ethereum
        .request({ method: "eth_chainId" })
        .then((hexChainId) => {
          const decChain = parseInt(hexChainId, 16);
          setChainId(decChain);
          setIsSepolia(decChain === SEPOLIA_CHAIN_ID);
        })
        .catch(console.error);

      // Event listeners
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount("");
        } else {
          setAccount(accounts[0].toLowerCase());
        }
      };

      const handleChainChanged = (hexChainId) => {
        const decChain = parseInt(hexChainId, 16);
        setChainId(decChain);
        setIsSepolia(decChain === SEPOLIA_CHAIN_ID);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  // Switch network to Sepolia
  const switchToSepolia = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to use blockchain features.");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
      setIsSepolia(true);
      return true;
    } catch (switchError) {
      // Chain not added to MetaMask yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [NETWORK_CONFIG],
          });
          setIsSepolia(true);
          return true;
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          throw addError;
        }
      }
      throw switchError;
    }
  };

  // Connect MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not detected. Please install the MetaMask extension.");
      window.open("https://metamask.io/download/", "_blank");
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0].toLowerCase();
        setAccount(userAddress);

        const currentChainHex = await window.ethereum.request({ method: "eth_chainId" });
        const currentChain = parseInt(currentChainHex, 16);
        setChainId(currentChain);

        if (currentChain !== SEPOLIA_CHAIN_ID) {
          try {
            await switchToSepolia();
          } catch (netErr) {
            console.warn("User declined or failed network switch to Sepolia:", netErr);
          }
        }

        setIsConnecting(false);
        return userAddress;
      }
    } catch (err) {
      console.error("Failed to connect MetaMask:", err);
      setError(err.message || "Failed to connect wallet.");
      setIsConnecting(false);
      throw err;
    }
  };

  const disconnectWallet = () => {
    setAccount("");
  };

  // Get ethers contract instance
  const getContract = useCallback(
    async (withSigner = false) => {
      if (!window.ethereum) {
        // Fallback to public JSON-RPC provider for read-only calls
        const defaultProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrls[0]);
        return new ethers.Contract(CONTRACT_ADDRESS, PhotoProofABI, defaultProvider);
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);

      if (withSigner) {
        const signer = await browserProvider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, PhotoProofABI, signer);
      }

      return new ethers.Contract(CONTRACT_ADDRESS, PhotoProofABI, browserProvider);
    },
    []
  );

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isSepolia,
        isConnected: !!account,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        getContract,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
