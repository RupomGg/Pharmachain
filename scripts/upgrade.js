const { ethers, upgrades } = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * @title PharmaChain UUPS Upgrade Script (V1 -> V2)
 * @notice Upgrades existing PharmaChain proxy to V2 implementation
 * @dev Uses OpenZeppelin Upgrades plugin for safe UUPS upgrades
 * 
 * Features:
 * - Validates storage layout compatibility
 * - Deploys new V2 implementation
 * - Upgrades proxy to point to V2
 * - Verifies upgrade success
 * - Updates deployment records
 */

async function main() {
  console.log('\n🔄 Starting PharmaChain V1 -> V2 Upgrade...\n');

  // Get network information
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === 'unknown' ? 'localhost' : network.name;
  const chainId = network.chainId.toString();

  console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);

  // Load existing deployment
  const deploymentPath = path.join(__dirname, '..', 'deployments', `${networkName}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for network ${networkName}. Please deploy V1 first.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const proxyAddress = deployment.contracts.PharmaChain.proxy;

  console.log(`📋 Existing Proxy: ${proxyAddress}`);
  console.log(`📋 Current Implementation: ${deployment.contracts.PharmaChain.implementation}`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`\n👤 Upgrading with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Get V2 contract factory
  const PharmaChainV2 = await ethers.getContractFactory('PharmaChainV2');

  console.log('🔍 Validating upgrade safety...');
  
  try {
    // Validate upgrade (checks storage layout compatibility)
    await upgrades.validateUpgrade(proxyAddress, PharmaChainV2, {
      kind: 'uups',
    });
    console.log('✅ Upgrade validation passed\n');
  } catch (error) {
    console.error('❌ Upgrade validation failed:');
    console.error(error.message);
    throw error;
  }

  console.log('🚀 Deploying V2 implementation...');

  // Upgrade the proxy to V2
  const upgradedContract = await upgrades.upgradeProxy(
    proxyAddress,
    PharmaChainV2,
    {
      kind: 'uups',
    }
  );

  await upgradedContract.waitForDeployment();

  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log(`✅ V2 Implementation deployed: ${newImplementationAddress}`);
  console.log(`✅ Proxy upgraded successfully: ${proxyAddress}\n`);

  // Verify the upgrade
  console.log('🔍 Verifying upgrade...');

  // Check version
  const version = await upgradedContract.version();
  console.log(`📌 Contract version: ${version}`);

  // Verify proxy still points to correct address
  const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  if (currentImpl.toLowerCase() !== newImplementationAddress.toLowerCase()) {
    throw new Error('Proxy implementation address mismatch!');
  }
  console.log('✅ Proxy implementation verified\n');

  // Test new V2 functionality
  console.log('🧪 Testing V2 features...');
  
  try {
    // Test getParticipantInfo (new V2 function)
    const [isReg, hash] = await upgradedContract.getParticipantInfo(deployer.address);
    console.log(`✅ V2 function accessible - Deployer registered: ${isReg}`);
  } catch (error) {
    console.error('❌ V2 function test failed:', error.message);
  }

  // Verify V1 data is preserved
  console.log('\n🔍 Verifying V1 data preservation...');
  
  try {
    // Check if roles are still intact
    const adminRole = await upgradedContract.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await upgradedContract.hasRole(adminRole, deployer.address);
    console.log(`✅ Admin role preserved: ${hasAdminRole}`);

    const manufacturerRole = await upgradedContract.MANUFACTURER_ROLE();
    const hasManufacturerRole = await upgradedContract.hasRole(manufacturerRole, deployer.address);
    console.log(`✅ Manufacturer role preserved: ${hasManufacturerRole}`);
  } catch (error) {
    console.error('❌ Data verification failed:', error.message);
  }

  // Update deployment file
  console.log('\n📝 Updating deployment records...');

  deployment.contracts.PharmaChain.implementation = newImplementationAddress;
  deployment.contracts.PharmaChain.version = version;
  deployment.contracts.PharmaChain.upgradedAt = new Date().toISOString();

  // Add upgrade history
  if (!deployment.contracts.PharmaChain.upgradeHistory) {
    deployment.contracts.PharmaChain.upgradeHistory = [];
  }

  deployment.contracts.PharmaChain.upgradeHistory.push({
    version: version,
    implementation: newImplementationAddress,
    upgradedAt: new Date().toISOString(),
    upgradedBy: deployer.address,
  });

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`✅ Deployment file updated: ${deploymentPath}\n`);

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 UPGRADE SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Network:              ${networkName}`);
  console.log(`Proxy Address:        ${proxyAddress}`);
  console.log(`Old Implementation:   ${deployment.contracts.PharmaChain.upgradeHistory[deployment.contracts.PharmaChain.upgradeHistory.length - 2]?.implementation || 'V1 (initial)'}`);
  console.log(`New Implementation:   ${newImplementationAddress}`);
  console.log(`Version:              ${version}`);
  console.log(`Upgraded By:          ${deployer.address}`);
  console.log('═'.repeat(60));

  console.log('\n✅ Upgrade completed successfully!\n');

  console.log('📋 Next Steps:');
  console.log('1. Update frontend to use new V2 functions');
  console.log('2. Register participants using registerParticipant()');
  console.log('3. Use createBatchWithMetadata() for new batches');
  console.log('4. Verify on block explorer (if on testnet/mainnet)\n');

  // Return upgrade info
  return {
    proxy: proxyAddress,
    implementation: newImplementationAddress,
    version: version,
  };
}

// Execute upgrade
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Upgrade failed:');
    console.error(error);
    process.exit(1);
  });
