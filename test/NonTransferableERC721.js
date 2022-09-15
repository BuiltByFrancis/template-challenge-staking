const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NonTransferableERC721", function () {
  var sut;

  beforeEach(async function () {
    // Deploy the system under test contract.
    const factory = await ethers.getContractFactory(
      "MockNonTransferableERC721"
    );
    sut = await factory.deploy();
    await sut.deployed();
  });

  describe("_beforeTokenTransfer", function () {
    it("should allow for minting", async function () {
      expect(await sut.MintSingle()).to.not.be.reverted;
    });

    it("should allow for burning", async function () {
      expect(await sut.MintThenBurnSingle()).to.not.be.reverted;
    });

    it("should revert with the NonTransferable error (dependant on minting)", async function () {
      const [owner, other] = await ethers.getSigners();

      // Mint an nft into the owners wallet.
      await sut.MintSingle();

      // Attemp to send the nft from the owners wallet to another wallet.
      await expect(
        sut.transferFrom(owner.address, other.address, 1)
      ).to.be.revertedWithCustomError(sut, "NonTransferable");
    });
  });

  describe("approve", function () {
    it("should revert with the NonApprovable error", async function () {
      const [owner] = await ethers.getSigners();
      await expect(sut.approve(owner.address, 1)).to.be.revertedWithCustomError(
        sut,
        "NonApprovable"
      );
    });
  });

  describe("setApprovalForAll", function () {
    it("should revert with the NonApprovable error", async function () {
      const [owner] = await ethers.getSigners();
      await expect(
        sut.setApprovalForAll(owner.address, true)
      ).to.be.revertedWithCustomError(sut, "NonApprovable");
    });
  });
});
