const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PhotoProof Smart Contract", function () {
  let photoProof;
  let owner;
  let alice;
  let bob;

  // Sample photo hashes
  const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("image_content_1"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("image_content_2"));
  const sampleCID1 = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const sampleCID2 = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const PhotoProofFactory = await ethers.getContractFactory("PhotoProof");
    photoProof = await PhotoProofFactory.deploy();
    await photoProof.waitForDeployment();
  });

  describe("Registration", function () {
    it("should successfully register a new photo and emit PhotoRegistered", async function () {
      const tx = await photoProof.connect(alice).registerPhoto(sampleHash1, sampleCID1);
      await expect(tx)
        .to.emit(photoProof, "PhotoRegistered")
        .withArgs(sampleHash1, alice.address, sampleCID1, (val) => val > 0);

      const [recordOwner, timestamp, ipfsCID, isRegistered] = await photoProof.verifyPhoto(sampleHash1);
      expect(isRegistered).to.be.true;
      expect(recordOwner).to.equal(alice.address);
      expect(ipfsCID).to.equal(sampleCID1);
      expect(timestamp).to.be.gt(0);
    });

    it("should reject duplicate photo hashes", async function () {
      await photoProof.connect(alice).registerPhoto(sampleHash1, sampleCID1);
      await expect(
        photoProof.connect(bob).registerPhoto(sampleHash1, "QmAnotherCID")
      ).to.be.revertedWith("Photo hash already registered");
    });

    it("should reject invalid/zero photo hash", async function () {
      await expect(
        photoProof.connect(alice).registerPhoto(ethers.ZeroHash, sampleCID1)
      ).to.be.revertedWith("Invalid photo hash: cannot be zero");
    });

    it("should reject empty IPFS CID", async function () {
      await expect(
        photoProof.connect(alice).registerPhoto(sampleHash1, "")
      ).to.be.revertedWith("IPFS CID required");
    });
  });

  describe("Verification", function () {
    it("should return false and zero address for unregistered photo", async function () {
      const [recordOwner, timestamp, ipfsCID, isRegistered] = await photoProof.verifyPhoto(sampleHash2);
      expect(isRegistered).to.be.false;
      expect(recordOwner).to.equal(ethers.ZeroAddress);
      expect(timestamp).to.equal(0n);
      expect(ipfsCID).to.equal("");
    });
  });

  describe("Transfer Ownership", function () {
    beforeEach(async function () {
      await photoProof.connect(alice).registerPhoto(sampleHash1, sampleCID1);
    });

    it("should allow the owner to transfer photo ownership", async function () {
      const tx = await photoProof.connect(alice).transferOwnership(sampleHash1, bob.address);
      await expect(tx)
        .to.emit(photoProof, "OwnershipTransferred")
        .withArgs(sampleHash1, alice.address, bob.address, (val) => val > 0);

      const [newOwner] = await photoProof.verifyPhoto(sampleHash1);
      expect(newOwner).to.equal(bob.address);

      // Verify user lists
      const bobPhotos = await photoProof.getUserPhotos(bob.address);
      expect(bobPhotos).to.include(sampleHash1);
      const alicePhotos = await photoProof.getUserPhotos(alice.address);
      expect(alicePhotos).to.not.include(sampleHash1);
    });

    it("should reject transfer from non-owner", async function () {
      await expect(
        photoProof.connect(bob).transferOwnership(sampleHash1, bob.address)
      ).to.be.revertedWith("Only current owner can transfer photo");
    });

    it("should reject transfer to zero address", async function () {
      await expect(
        photoProof.connect(alice).transferOwnership(sampleHash1, ethers.ZeroAddress)
      ).to.be.revertedWith("New owner cannot be zero address");
    });

    it("should reject transfer to current owner", async function () {
      await expect(
        photoProof.connect(alice).transferOwnership(sampleHash1, alice.address)
      ).to.be.revertedWith("New owner must be different from current owner");
    });
  });

  describe("User photo tracking", function () {
    it("should track user photos correctly", async function () {
      await photoProof.connect(alice).registerPhoto(sampleHash1, sampleCID1);
      await photoProof.connect(alice).registerPhoto(sampleHash2, sampleCID2);

      const alicePhotos = await photoProof.getUserPhotos(alice.address);
      expect(alicePhotos.length).to.equal(2);
      expect(alicePhotos).to.include(sampleHash1);
      expect(alicePhotos).to.include(sampleHash2);

      const total = await photoProof.getTotalPhotos();
      expect(total).to.equal(2n);
    });
  });
});
