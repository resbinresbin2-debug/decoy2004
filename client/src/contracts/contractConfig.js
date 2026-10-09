// PhotoProof Smart Contract Configuration
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const NETWORK_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: "Ethereum Sepolia Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "SEP",
    decimals: 18,
  },
  rpcUrls: [
    import.meta.env.VITE_SEPOLIA_RPC || "https://rpc.sepolia.org",
    "https://ethereum-sepolia.publicnode.com",
    "https://sepolia.drpc.org",
  ],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const getEtherscanTxUrl = (txHash) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

export const getEtherscanAddressUrl = (address) => {
  return `https://sepolia.etherscan.io/address/${address}`;
};
