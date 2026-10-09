const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying PhotoProof smart contract...");
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} ETH`);

  const PhotoProof = await hre.ethers.getContractFactory("PhotoProof");
  const photoProof = await PhotoProof.deploy();
  await photoProof.waitForDeployment();

  const contractAddress = await photoProof.getAddress();
  console.log(`>>> PhotoProof deployed successfully to: ${contractAddress}`);
  console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId || 31337})`);
  console.log("--------------------------------------------------");

  // Export deployment info for client
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  const artifactPath = path.join(__dirname, "../artifacts/contracts/PhotoProof.sol/PhotoProof.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  // Create contract config in client if directory exists
  const clientConfigDir = path.join(__dirname, "../../client/src/contracts");
  if (!fs.existsSync(clientConfigDir)) {
    fs.mkdirSync(clientConfigDir, { recursive: true });
  }

  const clientConfigFile = path.join(clientConfigDir, "contractConfig.js");
  const clientConfigContent = `// Auto-generated during Hardhat deployment
export const CONTRACT_ADDRESS = "${contractAddress}";
export const CHAIN_ID = ${hre.network.config.chainId || 11155111};
export const NETWORK_NAME = "${hre.network.name}";
`;
  fs.writeFileSync(clientConfigFile, clientConfigContent);

  if (abi.length > 0) {
    fs.writeFileSync(
      path.join(clientConfigDir, "PhotoProofABI.json"),
      JSON.stringify(abi, null, 2)
    );
  }

  console.log(`Updated client contract config at: ${clientConfigFile}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
