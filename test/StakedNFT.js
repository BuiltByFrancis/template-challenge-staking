const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("StakedNFT", function () {
  var owner;
  var user;
  var defaultDecimals;
  var blocksPerDay;
  var defaultRates;
  var tokenContract;
  var nftContract;
  var sut;

  beforeEach(async function () {
    const [deployer, other] = await ethers.getSigners();
    owner = deployer;
    user = other;

    defaultDecimals = 18;
    blocksPerDay = BigNumber.from("5000");
    defaultRates = [
      BigNumber.from("50"),
      BigNumber.from("100"),
      BigNumber.from("0"),
    ];

    // Deploy a token contract
    const tokenFactory = await ethers.getContractFactory("Token");
    tokenContract = await tokenFactory.deploy(defaultDecimals);
    await tokenContract.deployed();

    // Deploy an nft contract
    const nftFactory = await ethers.getContractFactory("NFT");
    nftContract = await nftFactory.deploy();
    await nftContract.deployed();

    // Mint token ids 1 and 2 to the owner wallet.
    await nftContract.Mint();
    await nftContract.Mint();

    // Mint token ids 3 and 4 to the user wallet.
    await nftContract.connect(other).Mint();
    await nftContract.connect(other).Mint();

    // Deploy the system under test contract.
    const factory = await ethers.getContractFactory("StakedNFT");
    sut = await factory.deploy(
      nftContract.address,
      blocksPerDay,
      defaultRates,
      tokenContract.address
    );
    await sut.deployed();
  });

  describe("constructor", function () {
    it("should set the values based on the parameters", async function () {
      expect(await sut.nftAddress()).to.eq(nftContract.address);

      // The expected default value of "finalRewardBlock" is the maximum uint256.
      expect(await sut.finalRewardBlock()).to.eq(
        BigNumber.from(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      );
    });
  });

  describe("depositsOf", function () {
    it("should return an empty array if the account owns nothing", async function () {
      const actual = await sut.depositsOf(user.address);
      expect(actual.length).to.eq(0);
    });

    it("should return each token id that the account owns", async function () {
      // Stake token id 3 and 4 from the users wallet so they own staked nft 3 and 4
      await nftContract.connect(user).setApprovalForAll(sut.address, true);
      await sut.connect(user).stake([3, 4]);

      // Ensure the depositsOf method returns token ids 3 and 4
      const actual = await sut.depositsOf(user.address);
      expect(actual.length).to.eq(2);
      expect(actual[0]).to.eq(3);
      expect(actual[1]).to.eq(4);
    });
  });

  describe("lastClaimsOf", function () {
    it("should return an empty array if no tokens are provided", async function () {
      const actual = await sut.lastClaimsOf([]);
      expect(actual.length).to.eq(0);
    });

    it("should return the last claimed blocknumber for the tokenIds", async function () {
      // Stake token id 4 from the users wallet so they own staked nft 4
      await nftContract.connect(user).setApprovalForAll(sut.address, true);
      await sut.connect(user).stake([4]);

      // Ensure the lastClaimsOf method returns results for both token 3 and 4
      const actual = await sut.lastClaimsOf([3, 4]);
      expect(actual.length).to.eq(2);
      expect(actual[0]).to.eq(0); // Token 3 has never been staked.
      expect(actual[1]).to.eq(await ethers.provider.getBlockNumber()); // Token 4 has been staked in the current block.
    });
  });

  describe("calculateRewards", function () {
    var ownerTokenId = 1;
    var userTokenId1 = 3;
    var userTokenId2 = 4;

    beforeEach(async function () {
      // Ensure the contract is emitting rewards
      await sut.toggleEmissionsActive();
      expect(await sut.emissionsActive()).to.eq(true);

      // Stake nft token 1 from the owners wallet.
      await nftContract.setApprovalForAll(sut.address, true);
      await sut.stake([ownerTokenId]);

      // Stake nft token 3 and 4 from the users wallet.
      await nftContract.connect(user).setApprovalForAll(sut.address, true);
      await sut.connect(user).stake([userTokenId1, userTokenId2]);
    });

    it("should return an empty array if no tokenIds are provided", async function () {
      const actual = await sut.calculateRewards(user.address, []);
      expect(actual.length).to.eq(0);
    });

    it("should return an array of rewards based on the tokenIds", async function () {
      // Mine 2 blocks
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      // Ensure that both user tokens yield 2 blocks worth of rewards.
      const rewards = await sut.calculateRewards(user.address, [
        userTokenId1,
        userTokenId2,
      ]);
      expect(rewards.length).to.eq(2);
      expect(rewards[0]).to.eq(BigNumber.from("20000000000000000"));
      expect(rewards[1]).to.eq(BigNumber.from("20000000000000000"));
    });

    it("should adhere to the finalRewardBlock value", async function () {
      // Mine a single block, set finalRewardBlock to the current block, mine another block.
      await ethers.provider.send("evm_mine");
      await sut.setFinalRewardBlock(await ethers.provider.getBlockNumber());
      await ethers.provider.send("evm_mine");

      // Ensure that both user tokens yield 1 blocks worth of rewards.
      const rewards = await sut.calculateRewards(user.address, [
        userTokenId1,
        userTokenId2,
      ]);
      expect(rewards.length).to.eq(2);
      expect(rewards[0]).to.eq(BigNumber.from("10000000000000000"));
      expect(rewards[1]).to.eq(BigNumber.from("10000000000000000"));
    });

    it("should revert if a tokenId does not exist", async function () {
      await expect(
        sut.calculateRewards(user.address, [userTokenId1, 5])
      ).to.be.revertedWithCustomError(sut, "MissingToken");
    });

    it("should revert if a tokenId does not belong to the account", async function () {
      await expect(
        sut.calculateRewards(owner.address, [ownerTokenId, userTokenId1])
      ).to.be.revertedWithCustomError(sut, "NotTokenOwner");
    });
  });

  describe("calculateReward", function () {
    var ownerTokenId = 1;
    var userTokenId = 3;

    beforeEach(async function () {
      // Ensure the contract is emitting rewards
      await sut.toggleEmissionsActive();
      expect(await sut.emissionsActive()).to.eq(true);

      // Stake nft token 1 from the owners wallet.
      await nftContract.setApprovalForAll(sut.address, true);
      await sut.stake([ownerTokenId]);

      // Stake nft token 3 from the users wallet.
      await nftContract.connect(user).setApprovalForAll(sut.address, true);
      await sut.connect(user).stake([userTokenId]);
    });

    it("should return the reward for the staked token", async function () {
      // Mine 2 blocks
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      // Ensure that the token yields 2 blocks worth of rewards.
      const reward = await sut.calculateReward(user.address, userTokenId);
      expect(reward).to.eq(BigNumber.from("20000000000000000"));
    });

    it("should adhere to the finalRewardBlock value", async function () {
      // Mine a single block, set finalRewardBlock to the current block, mine another block.
      await ethers.provider.send("evm_mine");
      await sut.setFinalRewardBlock(await ethers.provider.getBlockNumber());
      await ethers.provider.send("evm_mine");

      // Ensure that the token yields 1 blocks worth of rewards.
      const reward = await sut.calculateReward(user.address, userTokenId);
      expect(reward).to.eq(BigNumber.from("10000000000000000"));
    });

    it("should revert if a tokenId does not exist", async function () {
      await expect(
        sut.calculateReward(user.address, 5)
      ).to.be.revertedWithCustomError(sut, "MissingToken");
    });

    it("should revert if a tokenId does not belong to the account", async function () {
      await expect(
        sut.calculateReward(owner.address, userTokenId)
      ).to.be.revertedWithCustomError(sut, "NotTokenOwner");
    });
  });

  describe("stake", function () {
    var ownerTokenId = 1;
    var userTokenId1 = 3;
    var userTokenId2 = 4;

    beforeEach(async function () {
      // Ensure the contract is emitting rewards.
      await sut.toggleEmissionsActive();
      expect(await sut.emissionsActive()).to.eq(true);

      // Approve the sut contract to transfer all of the users nfts.
      await nftContract.connect(user).setApprovalForAll(sut.address, true);
    });

    it("should set the lastClaimedAt value for each token to the current block", async function () {
      await sut.connect(user).stake([userTokenId1, userTokenId2]);
      const bn = await ethers.provider.getBlockNumber();
      expect(await sut.lastClaimedAt(userTokenId1)).to.eq(bn);
      expect(await sut.lastClaimedAt(userTokenId2)).to.eq(bn);
    });

    it("should transfer the nfts to the contract", async function () {
      await sut.connect(user).stake([userTokenId1, userTokenId2]);
      expect(await nftContract.ownerOf(userTokenId1)).to.eq(sut.address);
      expect(await nftContract.ownerOf(userTokenId2)).to.eq(sut.address);
    });

    it("should mint a staked nft in place of each token with the same id", async function () {
      await sut.connect(user).stake([userTokenId1, userTokenId2]);
      expect(await sut.balanceOf(user.address)).to.eq(2);
      expect(await sut.ownerOf(userTokenId1)).to.eq(user.address);
      expect(await sut.ownerOf(userTokenId2)).to.eq(user.address);
    });

    it("should revert if a tokenId cannot be transfered", async function () {
      await expect(sut.stake([ownerTokenId])).to.be.reverted;
      await expect(sut.stake([userTokenId1])).to.be.reverted;
      await expect(sut.stake([5])).to.be.reverted;
    });
  });

  describe("unstake", function () {
    var ownerTokenId = 1;
    var userTokenId1 = 3;
    var userTokenId2 = 4;

    beforeEach(async function () {
      // Ensure the contract is emitting rewards.
      await sut.toggleEmissionsActive();
      expect(await sut.emissionsActive()).to.eq(true);

      // Approve the sut contract to transfer all of the owners nfts.
      await nftContract.setApprovalForAll(sut.address, true);

      // Stake nft token 3 and 4 from the users wallet.
      await nftContract.connect(user).setApprovalForAll(sut.address, true);
      await sut.connect(user).stake([userTokenId1, userTokenId2]);
    });

    it("should claim the rewards for each token", async function () {
      // Note: this test is an aggregate test to ensure _claimRewards is called.
      // This functionallity is tested in the "claimRewards" tests.

      // Transfer 1000 tokens to the sut contract. This action takes 1 block.
      const transferred = ethers.utils.parseUnits("1000", defaultDecimals);
      await tokenContract.transfer(sut.address, transferred);

      // Reward is based on 2 blocks passing for 2 tokens with default emissions.
      const reward = BigNumber.from("40000000000000000");
      const nextBlock = 1 + (await ethers.provider.getBlockNumber());
      const tokenIds = [userTokenId1, userTokenId2];

      // Ensure the TokensClaimed event is emitted correctly
      await expect(sut.connect(user).claimRewards(tokenIds))
        .to.emit(sut, "TokensClaimed")
        .withArgs(user.address, tokenIds, reward, nextBlock);

      // Ensure lastClaimedAt is updated for both user tokens.
      expect(await sut.lastClaimedAt(userTokenId1)).to.be.eq(nextBlock);
      expect(await sut.lastClaimedAt(userTokenId2)).to.be.eq(nextBlock);

      // Ensure the token balance of the contract and user is correctly updated.
      expect(await tokenContract.balanceOf(user.address)).to.eq(reward);
      expect(await tokenContract.balanceOf(sut.address)).to.eq(
        transferred.sub(reward)
      );
    });

    it("should revert if a tokenId does not exist", async function () {
      await expect(
        sut.connect(user).unstake([userTokenId1, 5])
      ).to.be.revertedWithCustomError(sut, "MissingToken");
    });

    it("should revert if a tokenId does not belong to the sender", async function () {
      await sut.stake([ownerTokenId]);
      await expect(
        sut.connect(user).unstake([userTokenId1, ownerTokenId])
      ).to.be.revertedWithCustomError(sut, "NotTokenOwner");
    });

    it("should burn the staked nft", async function () {
      // Ensure both staked nft tokens are sent to the burn address by checking the Transfer events emitted.
      await expect(sut.connect(user).unstake([userTokenId1, userTokenId2]))
        .to.emit(sut, "Transfer")
        .withArgs(
          user.address,
          "0x0000000000000000000000000000000000000000",
          userTokenId1
        )
        .to.emit(sut, "Transfer")
        .withArgs(
          user.address,
          "0x0000000000000000000000000000000000000000",
          userTokenId2
        );

      // Ensure the user wallet has no remaining staked nft tokens.
      expect(await sut.balanceOf(user.address)).to.eq(0);
    });

    it("should return the callers original nfts", async function () {
      await sut.connect(user).unstake([userTokenId1, userTokenId2]);
      expect(await nftContract.balanceOf(user.address)).to.eq(2);
      expect(await nftContract.ownerOf(userTokenId1)).to.eq(user.address);
      expect(await nftContract.ownerOf(userTokenId2)).to.eq(user.address);
    });
  });

  describe("claimRewards", function () {
    var ownerTokenId = 1;
    var userTokenId1 = 3;
    var userTokenId2 = 4;

    beforeEach(async function () {
      // Ensure the contract is emitting rewards.
      await sut.toggleEmissionsActive();
      expect(await sut.emissionsActive()).to.eq(true);

      // Approve the sut contract to transfer all of the owners nfts.
      await nftContract.setApprovalForAll(sut.address, true);

      // Stake nft token 3 and 4 from the users wallet.
      await nftContract.connect(user).setApprovalForAll(sut.address, true);
      await sut.connect(user).stake([userTokenId1, userTokenId2]);
    });

    it("should revert if a tokenId does not exist", async function () {
      await expect(
        sut.connect(user).claimRewards([userTokenId1, 5])
      ).to.be.revertedWithCustomError(sut, "MissingToken");
    });

    it("should revert if a tokenId does not belong to the sender", async function () {
      await sut.stake([ownerTokenId]);
      await expect(
        sut.connect(user).claimRewards([userTokenId1, ownerTokenId])
      ).to.be.revertedWithCustomError(sut, "NotTokenOwner");
    });

    it("should reset the lastClaimedAt to the current blocknumber for each token", async function () {
      // Mine a block
      await ethers.provider.send("evm_mine");

      // Claim rewards
      await sut.connect(user).claimRewards([userTokenId1, userTokenId2]);

      // Ensure the lastClaimedAt value is updated for both staked tokens.
      const bn = await ethers.provider.getBlockNumber();
      expect(await sut.lastClaimedAt(userTokenId1)).to.be.eq(bn);
      expect(await sut.lastClaimedAt(userTokenId2)).to.be.eq(bn);
    });

    it("should emit the TokensClaimed event", async function () {
      const nextBlock = 1 + (await ethers.provider.getBlockNumber());
      const tokenIds = [userTokenId1, userTokenId2];
      const reward = BigNumber.from("20000000000000000");
      await expect(sut.connect(user).claimRewards(tokenIds))
        .to.emit(sut, "TokensClaimed")
        .withArgs(user.address, tokenIds, reward, nextBlock);
    });

    it("should transfer the combined reward to the caller", async function () {
      const transferred = ethers.utils.parseUnits("1000", defaultDecimals);

      // 10000000000000000 per block per token
      const expected = BigNumber.from("40000000000000000");

      await tokenContract.transfer(sut.address, transferred);

      await sut.connect(user).claimRewards([userTokenId1, userTokenId2]);
      expect(await tokenContract.balanceOf(user.address)).to.eq(expected);
      expect(await tokenContract.balanceOf(sut.address)).to.eq(
        transferred.sub(expected)
      );
    });
  });

  describe("setNFTAddress", function () {
    var secondNftContract;

    beforeEach(async function () {
      // Deploy a second nft contract.
      const nftFactory = await ethers.getContractFactory("NFT");
      secondNftContract = await nftFactory.deploy();
      await secondNftContract.deployed();
    });

    it("should set the nftAddress value", async function () {
      const expected = secondNftContract.address;
      await sut.setNFTAddress(expected);
      expect(await sut.nftAddress()).to.eq(expected);
    });

    it("should only be callable as the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(sut.connect(other).setNFTAddress(secondNftContract.address))
        .to.be.reverted;
    });
  });

  describe("setFinalRewardBlock", function () {
    it("should set the finalRewardBlock value", async function () {
      const expected = BigNumber.from("1000000000000");
      await sut.setFinalRewardBlock(expected);
      expect(await sut.finalRewardBlock()).to.eq(expected);
    });

    it("should only be callable as the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(
        sut.connect(other).setFinalRewardBlock(BigNumber.from("1000000000000"))
      ).to.be.reverted;
    });
  });
});
