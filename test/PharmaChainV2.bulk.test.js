// Example test for bulk batch creation feature
// This demonstrates how to use the createBatchesBulk function

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PharmaChainV2 - Bulk Batch Creation", function () {
    let pharmaChain;
    let admin, manufacturer, distributor;
    
    beforeEach(async function () {
        [admin, manufacturer, distributor] = await ethers.getSigners();
        
        // Deploy PharmaChain V1
        const PharmaChain = await ethers.getContractFactory("PharmaChain");
        const pharmaChainV1 = await upgrades.deployProxy(
            PharmaChain,
            [admin.address],
            { initializer: "initialize" }
        );
        await pharmaChainV1.waitForDeployment();
        
        // Upgrade to V2
        const PharmaChainV2 = await ethers.getContractFactory("PharmaChainV2");
        pharmaChain = await upgrades.upgradeProxy(
            await pharmaChainV1.getAddress(),
            PharmaChainV2
        );
        
        // Grant manufacturer role
        const MANUFACTURER_ROLE = await pharmaChain.MANUFACTURER_ROLE();
        await pharmaChain.connect(admin).grantRole(MANUFACTURER_ROLE, manufacturer.address);
    });
    
    describe("createBatchesBulk", function () {
        it("Should create multiple batches successfully", async function () {
            const quantities = [1000, 2000, 1500];
            const units = ["Box", "Box", "Vial"];
            const ipfsHashes = [
                "QmHash1234567890abcdef",
                "QmHash2234567890abcdef",
                "QmHash3234567890abcdef"
            ];
            const manufacturerBatchNumbers = ["BN-101", "BN-102", "BN-103"];
            
            const tx = await pharmaChain.connect(manufacturer).createBatchesBulk(
                quantities,
                units,
                ipfsHashes,
                manufacturerBatchNumbers
            );
            
            const receipt = await tx.wait();
            
            // Check that individual events were emitted for each batch
            const batchCreatedEvents = receipt.logs.filter(
                log => log.fragment?.name === "BatchCreated"
            );
            expect(batchCreatedEvents.length).to.equal(3);
            
            // Check that bulk event was emitted
            const bulkEvent = receipt.logs.find(
                log => log.fragment?.name === "BulkBatchCreated"
            );
            expect(bulkEvent).to.not.be.undefined;
            
            // Verify batch details
            const batch1 = await pharmaChain.getBatch(1);
            expect(batch1.quantity).to.equal(1000);
            expect(batch1.unit).to.equal("Box");
            expect(batch1.manufacturer).to.equal(manufacturer.address);
            
            const batch2 = await pharmaChain.getBatch(2);
            expect(batch2.quantity).to.equal(2000);
            
            const batch3 = await pharmaChain.getBatch(3);
            expect(batch3.quantity).to.equal(1500);
            expect(batch3.unit).to.equal("Vial");
        });
        
        it("Should revert if arrays have different lengths", async function () {
            const quantities = [1000, 2000];
            const units = ["Box", "Box", "Vial"]; // Different length
            const ipfsHashes = ["QmHash1", "QmHash2"];
            const manufacturerBatchNumbers = ["BN-101", "BN-102"];
            
            await expect(
                pharmaChain.connect(manufacturer).createBatchesBulk(
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                )
            ).to.be.revertedWithCustomError(pharmaChain, "ArrayLengthMismatch");
        });
        
        it("Should revert if arrays are empty", async function () {
            await expect(
                pharmaChain.connect(manufacturer).createBatchesBulk([], [], [], [])
            ).to.be.revertedWithCustomError(pharmaChain, "EmptyArray");
        });
        
        it("Should revert if batch count exceeds 50", async function () {
            const quantities = new Array(51).fill(1000);
            const units = new Array(51).fill("Box");
            const ipfsHashes = new Array(51).fill("QmHash123");
            const manufacturerBatchNumbers = new Array(51).fill("BN-001");
            
            await expect(
                pharmaChain.connect(manufacturer).createBatchesBulk(
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                )
            ).to.be.revertedWithCustomError(pharmaChain, "BatchLimitExceeded");
        });
        
        it("Should revert if any quantity is zero", async function () {
            const quantities = [1000, 0, 1500]; // Zero quantity
            const units = ["Box", "Box", "Vial"];
            const ipfsHashes = ["QmHash1", "QmHash2", "QmHash3"];
            const manufacturerBatchNumbers = ["BN-101", "BN-102", "BN-103"];
            
            await expect(
                pharmaChain.connect(manufacturer).createBatchesBulk(
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                )
            ).to.be.revertedWithCustomError(pharmaChain, "InvalidQuantity");
        });
        
        it("Should revert if any IPFS hash is empty", async function () {
            const quantities = [1000, 2000, 1500];
            const units = ["Box", "Box", "Vial"];
            const ipfsHashes = ["QmHash1", "", "QmHash3"]; // Empty hash
            const manufacturerBatchNumbers = ["BN-101", "BN-102", "BN-103"];
            
            await expect(
                pharmaChain.connect(manufacturer).createBatchesBulk(
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                )
            ).to.be.revertedWithCustomError(pharmaChain, "InvalidIPFSHash");
        });
        
        it("Should revert if caller is not a manufacturer", async function () {
            const quantities = [1000];
            const units = ["Box"];
            const ipfsHashes = ["QmHash1"];
            const manufacturerBatchNumbers = ["BN-101"];
            
            await expect(
                pharmaChain.connect(distributor).createBatchesBulk(
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                )
            ).to.be.reverted; // AccessControl revert
        });
        
        it("Should emit BulkBatchCreated event with correct parameters", async function () {
            const quantities = [1000, 2000];
            const units = ["Box", "Vial"];
            const ipfsHashes = ["QmHash1", "QmHash2"];
            const manufacturerBatchNumbers = ["BN-101", "BN-102"];
            
            await expect(
                pharmaChain.connect(manufacturer).createBatchesBulk(
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                )
            )
                .to.emit(pharmaChain, "BulkBatchCreated")
                .withArgs(
                    1, // firstBatchId
                    2, // count
                    manufacturer.address,
                    manufacturerBatchNumbers
                );
        });
        
        it("Should handle maximum batch count (50 batches)", async function () {
            const quantities = new Array(50).fill(1000);
            const units = new Array(50).fill("Box");
            const ipfsHashes = new Array(50).fill("QmHash123");
            const manufacturerBatchNumbers = Array.from(
                { length: 50 },
                (_, i) => `BN-${String(i + 1).padStart(3, '0')}`
            );
            
            const tx = await pharmaChain.connect(manufacturer).createBatchesBulk(
                quantities,
                units,
                ipfsHashes,
                manufacturerBatchNumbers
            );
            
            const receipt = await tx.wait();
            
            // Verify all 50 batches were created
            const batch50 = await pharmaChain.getBatch(50);
            expect(batch50.quantity).to.equal(1000);
            expect(batch50.manufacturer).to.equal(manufacturer.address);
        });
    });
    
    describe("Gas Benchmarking", function () {
        it("Should measure gas for different batch counts", async function () {
            const testCases = [1, 10, 25, 50];
            
            for (const count of testCases) {
                const quantities = new Array(count).fill(1000);
                const units = new Array(count).fill("Box");
                const ipfsHashes = new Array(count).fill("QmHash123");
                const manufacturerBatchNumbers = Array.from(
                    { length: count },
                    (_, i) => `BN-${String(i + 1).padStart(3, '0')}`
                );
                
                const tx = await pharmaChain.connect(manufacturer).createBatchesBulk(
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                );
                
                const receipt = await tx.wait();
                console.log(`Gas used for ${count} batches: ${receipt.gasUsed.toString()}`);
            }
        });
    });
});
