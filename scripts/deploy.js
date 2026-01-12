const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy PharmaChain UUPS Upgradeable Contract
 * 
 * This script:
 * 1. Deploys the UUPS proxy with initialization
 * 2. Logs proxy and implementation addresses
 * 3. Grants MANUFACTURER_ROLE to deployer for testing
 * 4. Saves deployment addresses to JSON file
 */
async function main() {
  console.log("\n🚀 Starting PharmaChain UUPS Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get admin address from environment or use deployer
  const adminAddress = process.env.ADMIN_ADDRESS || deployer.address;
  console.log("👤 Admin address:", adminAddress);

  // Get contract factory
  console.log("📦 Getting PharmaChainV2 contract factory...");
  const PharmaChain = await hre.ethers.getContractFactory("PharmaChainV2");

  // Deploy proxy with initialization
  console.log("🔨 Deploying UUPS proxy and implementation...");
  const pharmaChain = await hre.upgrades.deployProxy(
    PharmaChain,
    [adminAddress], // initialize(address admin)
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await pharmaChain.waitForDeployment();

  const proxyAddress = await pharmaChain.getAddress();
  console.log("\n✅ PharmaChain Proxy deployed to:", proxyAddress);

  // Get implementation address
  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );
  console.log("📋 Implementation contract:", implementationAddress);

  // Get admin address (proxy admin)
  const adminContractAddress = await hre.upgrades.erc1967.getAdminAddress(
    proxyAddress
  );
  console.log("🔐 Proxy Admin contract:", adminContractAddress);

  // Grant MANUFACTURER_ROLE to deployer for testing
  console.log("\n🎭 Setting up roles...");
  const MANUFACTURER_ROLE = await pharmaChain.MANUFACTURER_ROLE();
  
  // Check if deployer already has the role
  const hasRole = await pharmaChain.hasRole(MANUFACTURER_ROLE, deployer.address);
  
  if (!hasRole) {
    const tx = await pharmaChain.grantManufacturerRole(deployer.address);
    await tx.wait();
    console.log("✅ Granted MANUFACTURER_ROLE to:", deployer.address);
  } else {
    console.log("ℹ️  Deployer already has MANUFACTURER_ROLE");
  }

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalBatches = await pharmaChain.getTotalBatches();
  console.log("📊 Total batches:", totalBatches.toString());
  console.log("✅ Contract is operational!");

  // Save deployment addresses
  const networkName = hre.network.name;
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: networkName,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      PharmaChain: {
        proxy: proxyAddress,
        implementation: implementationAddress,
        admin: adminContractAddress,
        deployer: deployer.address,
        adminAddress: adminAddress,
        deployedAt: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
      },
    },
  };

  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment addresses saved to:", deploymentFile);

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", networkName);
  console.log("Chain ID:", deploymentData.chainId);
  console.log("\n🎯 USE THIS ADDRESS IN YOUR FRONTEND:");
  console.log("Proxy Address:", proxyAddress);
  console.log("\n📄 Contract ABI Location:");
  console.log("artifacts/contracts/PharmaChain.sol/PharmaChain.json");
  console.log("=".repeat(60) + "\n");

  // Optional: Verify on Etherscan (if not localhost)
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      console.log("🔍 Verifying implementation contract on Etherscan...");
      await hre.run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually later using:");
      console.log(`npx hardhat verify --network ${networkName} ${implementationAddress}`);
    }
  }

  console.log("\n✨ Deployment complete!\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
