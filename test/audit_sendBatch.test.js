
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Audit: sendBatch (Partial Transfer)", function () {
  let pharmaChain;
  let admin, manufacturer, distributor;
  const BATCH_Quantity = 1000;
  const TRANSFER_Quantity = 200;


  before(async function () {
    [admin, manufacturer, distributor] = await ethers.getSigners();

    // Deploy V2 Directly for logic testing
    const PharmaChainV2 = await ethers.getContractFactory("PharmaChainV2");
    pharmaChain = await upgrades.deployProxy(PharmaChainV2, [admin.address], {
        initializer: "initialize",
        kind: "uups",
    });
    await pharmaChain.waitForDeployment();

    // Grant Manufacturer Role
    const MANUFACTURER_ROLE = await pharmaChain.MANUFACTURER_ROLE();
    await pharmaChain.grantRole(MANUFACTURER_ROLE, manufacturer.address);
  });


  it("Should correctly handle partial batch transfer and assign new ID to distributor", async function () {
    // 1. Setup: Mint Batch #1
    await pharmaChain.connect(manufacturer).createBatchWithMetadata(BATCH_Quantity, "Boxes", "QmTestHash");
    
    // Verify initial state

    // 3. Verify initial state
    // Note: _batchIdCounter starts at 1 in initialize()
    const manufacturerBatches = await pharmaChain.getBatchesByOwner(manufacturer.address);
    const batchId = manufacturerBatches[0]; // Should be 1
    console.log(`[Audit] Found Manufacturer Batch ID: ${batchId}`);

    const batch1 = await pharmaChain.getBatch(batchId);
    expect(batch1.quantity).to.equal(BATCH_Quantity);
    expect(batch1.currentOwner).to.equal(manufacturer.address);


    console.log(`[Audit] Created Batch #${batchId} with ${batch1.quantity} units.`);

    // 2. Action: Manufacturer calls sendBatch
    console.log(`[Audit] Transferring ${TRANSFER_Quantity} units to Distributor (${distributor.address})...`);
    
    const tx = await pharmaChain.connect(manufacturer).sendBatch(batchId, distributor.address, TRANSFER_Quantity);
    const receipt = await tx.wait();

    // Capture the new batch ID from event
    // The BatchTransfer event is the 2nd one emitted (index 1) usually, but let's filter
    const transferEvent = (await pharmaChain.queryFilter("BatchTransfer"))
        .find(e => e.transactionHash === tx.hash);
    
    expect(transferEvent).to.not.be.undefined;
    const newBatchId = transferEvent.args.newBatchId;
    console.log(`[Audit] New Batch ID created: #${newBatchId}`);

    // 3. Assertions
    
    // Check Manufacturer's batch (ID #0)
    const updatedBatch1 = await pharmaChain.getBatch(batchId);
    console.log(`[Audit] Assertion: Old Batch Qty should be ${BATCH_Quantity - TRANSFER_Quantity} (Actual: ${updatedBatch1.quantity})`);
    expect(updatedBatch1.quantity).to.equal(BigInt(BATCH_Quantity - TRANSFER_Quantity));

    // Check Distributor's batch list
    const distBatches = await pharmaChain.getBatchesByOwner(distributor.address);
    // Note: getBatchesByOwner returns IDs
    console.log(`[Audit] Assertion: Distributor should own new Batch #${newBatchId}`);
    expect(distBatches).to.include(newBatchId);

    // Check New Batch Details
    const newBatch = await pharmaChain.getBatch(newBatchId);
    
    console.log(`[Audit] Assertion: New Batch Owner should be Distributor`);
    expect(newBatch.currentOwner).to.equal(distributor.address);
    
    console.log(`[Audit] Assertion: New Batch Qty should be ${TRANSFER_Quantity}`);
    expect(newBatch.quantity).to.equal(BigInt(TRANSFER_Quantity));
    
    console.log(`[Audit] Assertion: Parent Batch ID should be ${batchId}`);
    expect(newBatch.parentBatchId).to.equal(batchId);

    console.log("✅ AUDIT PASSED: All logic assertions verified.");
  });
});
