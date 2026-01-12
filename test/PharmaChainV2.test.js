const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('PharmaChain V1 -> V2 Upgrade', function () {
  let pharmaChain;
  let pharmaChainV2;
  let owner, manufacturer, distributor, user;
  let proxyAddress;

  before(async function () {
    [owner, manufacturer, distributor, user] = await ethers.getSigners();
  });

  describe('Initial V1 Deployment', function () {
    it('Should deploy V1 as UUPS proxy', async function () {
      const PharmaChain = await ethers.getContractFactory('PharmaChain');
      
      pharmaChain = await upgrades.deployProxy(
        PharmaChain,
        [],
        {
          kind: 'uups',
          initializer: 'initialize',
        }
      );

      await pharmaChain.waitForDeployment();
      proxyAddress = await pharmaChain.getAddress();

      console.log(`    ✓ V1 Proxy deployed at: ${proxyAddress}`);
    });

    it('Should grant roles in V1', async function () {
      const MANUFACTURER_ROLE = await pharmaChain.MANUFACTURER_ROLE();
      const DISTRIBUTOR_ROLE = await pharmaChain.DISTRIBUTOR_ROLE();

      await pharmaChain.grantRole(MANUFACTURER_ROLE, manufacturer.address);
      await pharmaChain.grantRole(DISTRIBUTOR_ROLE, distributor.address);

      expect(await pharmaChain.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.be.true;
      expect(await pharmaChain.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
    });

    it('Should create batches in V1', async function () {
      const tx = await pharmaChain.connect(manufacturer).createBatch(1000, 'vials');
      await tx.wait();

      const batch = await pharmaChain.getBatch(1);
      expect(batch.quantity).to.equal(1000);
      expect(batch.unit).to.equal('vials');
      expect(batch.manufacturer).to.equal(manufacturer.address);
    });
  });

  describe('Upgrade to V2', function () {
    it('Should validate upgrade safety', async function () {
      const PharmaChainV2 = await ethers.getContractFactory('PharmaChainV2');

      // This should not throw if storage layout is compatible
      await upgrades.validateUpgrade(proxyAddress, PharmaChainV2, {
        kind: 'uups',
      });
    });

    it('Should upgrade to V2', async function () {
      const PharmaChainV2 = await ethers.getContractFactory('PharmaChainV2');

      pharmaChainV2 = await upgrades.upgradeProxy(proxyAddress, PharmaChainV2, {
        kind: 'uups',
      });

      await pharmaChainV2.waitForDeployment();

      const version = await pharmaChainV2.version();
      expect(version).to.equal('2.0.0');

      console.log(`    ✓ Upgraded to V2, version: ${version}`);
    });

    it('Should preserve V1 data after upgrade', async function () {
      // Check roles are preserved
      const MANUFACTURER_ROLE = await pharmaChainV2.MANUFACTURER_ROLE();
      expect(await pharmaChainV2.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.be.true;

      // Check batch data is preserved
      const batch = await pharmaChainV2.getBatch(1);
      expect(batch.quantity).to.equal(1000);
      expect(batch.unit).to.equal('vials');
      expect(batch.manufacturer).to.equal(manufacturer.address);
    });
  });

  describe('V2 Identity Verification Features', function () {
    it('Should register participant with identity hash', async function () {
      const MANUFACTURER_ROLE = await pharmaChainV2.MANUFACTURER_ROLE();
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('User PII Data'));

      await expect(
        pharmaChainV2.registerParticipant(user.address, MANUFACTURER_ROLE, identityHash)
      )
        .to.emit(pharmaChainV2, 'ParticipantRegistered')
        .withArgs(user.address, MANUFACTURER_ROLE, identityHash);

      const [isRegistered, storedHash] = await pharmaChainV2.getParticipantInfo(user.address);
      expect(isRegistered).to.be.true;
      expect(storedHash).to.equal(identityHash);
    });

    it('Should not allow duplicate registration', async function () {
      const MANUFACTURER_ROLE = await pharmaChainV2.MANUFACTURER_ROLE();
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('Duplicate'));

      await expect(
        pharmaChainV2.registerParticipant(user.address, MANUFACTURER_ROLE, identityHash)
      ).to.be.revertedWithCustomError(pharmaChainV2, 'ParticipantAlreadyRegistered');
    });

    it('Should update participant identity hash', async function () {
      const oldHash = await pharmaChainV2.identityHashes(user.address);
      const newHash = ethers.keccak256(ethers.toUtf8Bytes('Updated PII Data'));

      await expect(
        pharmaChainV2.updateParticipantHash(user.address, newHash)
      )
        .to.emit(pharmaChainV2, 'IdentityHashUpdated')
        .withArgs(user.address, oldHash, newHash);

      const [, storedHash] = await pharmaChainV2.getParticipantInfo(user.address);
      expect(storedHash).to.equal(newHash);
    });

    it('Should verify identity correctly', async function () {
      const correctHash = await pharmaChainV2.identityHashes(user.address);
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes('Wrong Data'));

      expect(await pharmaChainV2.verifyIdentity(user.address, correctHash)).to.be.true;
      expect(await pharmaChainV2.verifyIdentity(user.address, wrongHash)).to.be.false;
    });

    it('Should not allow non-admin to register participants', async function () {
      const MANUFACTURER_ROLE = await pharmaChainV2.MANUFACTURER_ROLE();
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('Unauthorized'));

      await expect(
        pharmaChainV2.connect(user).registerParticipant(
          manufacturer.address,
          MANUFACTURER_ROLE,
          identityHash
        )
      ).to.be.reverted;
    });
  });

  describe('V2 Enhanced Metadata Features', function () {
    it('Should create batch with metadata', async function () {
      const ipfsHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

      await expect(
        pharmaChainV2.connect(user).createBatchWithMetadata(500, 'boxes', ipfsHash)
      )
        .to.emit(pharmaChainV2, 'BatchCreated')
        .and.to.emit(pharmaChainV2, 'MetadataAdded');

      const batch = await pharmaChainV2.getBatch(2);
      expect(batch.quantity).to.equal(500);
      expect(batch.unit).to.equal('boxes');
    });

    it('Should add metadata to existing batch', async function () {
      const ipfsHash = 'QmNewMetadataHash123456789';

      await expect(
        pharmaChainV2.connect(user).addMetadata(2, ipfsHash)
      )
        .to.emit(pharmaChainV2, 'MetadataAdded')
        .withArgs(2, ipfsHash, user.address);
    });

    it('Should not allow empty IPFS hash', async function () {
      await expect(
        pharmaChainV2.connect(user).createBatchWithMetadata(100, 'units', '')
      ).to.be.revertedWithCustomError(pharmaChainV2, 'InvalidIPFSHash');
    });

    it('Should not allow non-owner to add metadata', async function () {
      const ipfsHash = 'QmUnauthorized';

      await expect(
        pharmaChainV2.connect(manufacturer).addMetadata(2, ipfsHash)
      ).to.be.revertedWithCustomError(pharmaChainV2, 'NotBatchOwner');
    });
  });

  describe('V2 Backward Compatibility', function () {
    it('Should still support V1 createBatch function', async function () {
      const tx = await pharmaChainV2.connect(user).createBatch(250, 'tablets');
      await tx.wait();

      const batch = await pharmaChainV2.getBatch(3);
      expect(batch.quantity).to.equal(250);
      expect(batch.unit).to.equal('tablets');
    });

    it('Should still support V1 transfer functions', async function () {
      await pharmaChainV2.connect(user).initiateTransfer(3, distributor.address);
      
      const batch = await pharmaChainV2.getBatch(3);
      expect(batch.pendingRecipient).to.equal(distributor.address);
    });
  });
});
