const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PharmaChain", function () {
  let PharmaChain;
  let pharmaChain;
  let owner, distributor, pharmacy, stranger;
  
  // Role Hashes
  const MANUFACTURER_ROLE = ethers.id("MANUFACTURER_ROLE");
  const DISTRIBUTOR_ROLE = ethers.id("DISTRIBUTOR_ROLE");
  const PHARMACY_ROLE = ethers.id("PHARMACY_ROLE");

  beforeEach(async function () {
    [owner, distributor, pharmacy, stranger] = await ethers.getSigners();
    PharmaChain = await ethers.getContractFactory("PharmaChain");
    pharmaChain = await PharmaChain.deploy();

    // Setup Roles for Testing
    // Owner is admin by constructor. 
    // Grant Manufacturer Role to Owner (so they can create batches)
    await pharmaChain.registerParticipant(owner.address, MANUFACTURER_ROLE);
    // Grant Distributor Role to Distributor
    await pharmaChain.registerParticipant(distributor.address, DISTRIBUTOR_ROLE);
    // Grant Pharmacy Role to Pharmacy
    await pharmaChain.registerParticipant(pharmacy.address, PHARMACY_ROLE);
  });

  describe("Deployment", function () {
    it("Should start with 0 batches", async function () {
      expect(await pharmaChain.batchCount()).to.equal(0);
    });
    it("Should assign Admin role to deployer", async function () {
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        expect(await pharmaChain.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Batch Creation", function () {
    it("Should create a new batch if sender has MANUFACTURER_ROLE", async function () {
      const ipfsHash = "QmTest123";
      await expect(pharmaChain.createBatch(ipfsHash))
        .to.emit(pharmaChain, "BatchCreated")
        .withArgs(1, owner.address, ipfsHash);
    });

    it("Should FAIL if sender does NOT have MANUFACTURER_ROLE", async function () {
      await expect(
        pharmaChain.connect(stranger).createBatch("QmFail")
      ).to.be.revertedWithCustomError(pharmaChain, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Supply Chain Flow", function () {
    beforeEach(async function () {
      await pharmaChain.createBatch("QmBatch1");
    });

    it("Should allow owner to initiate transfer to a Registered Distributor", async function () {
      await expect(pharmaChain.initiateTransfer(1, distributor.address))
        .to.emit(pharmaChain, "TransferInitiated")
        .withArgs(1, owner.address, distributor.address);
    });

    it("Should FAIL if initiating transfer to Unregistered Entity", async function () {
        await expect(
            pharmaChain.initiateTransfer(1, stranger.address)
        ).to.be.revertedWith("Recipient is not a registered entity");
    });

    it("Should complete the full transfer handshake", async function () {
      // 1. Owner initiates
      await pharmaChain.initiateTransfer(1, distributor.address);

      // 2. Distributor accepts
      await expect(pharmaChain.connect(distributor).acceptTransfer(1))
        .to.emit(pharmaChain, "TransferAccepted")
        .withArgs(1, distributor.address);

      // 3. Verify ownership change
      const batch = await pharmaChain.batches(1);
      expect(batch.currentOwner).to.equal(distributor.address);
      expect(batch.status).to.equal(2); // DELIVERED
    });
  });
});
