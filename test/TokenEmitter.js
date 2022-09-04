const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("TokenEmitter", function () {
  var defaultDecimals;
  var blocksPerDay;
  var defaultRates;
  var tokenContract;
  var sut;

  beforeEach(async function () {
    defaultDecimals = 18;
    blocksPerDay = BigNumber.from("5000");
    defaultRates = [
      BigNumber.from("50"),
      BigNumber.from("100"),
      BigNumber.from("0"),
    ];

    // Deploy the token contract.
    const tokenFactory = await ethers.getContractFactory("Token");
    tokenContract = await tokenFactory.deploy(defaultDecimals);
    await tokenContract.deployed();

    // Deploy the system under test contract.
    const factory = await ethers.getContractFactory("MockTokenEmitter");
    sut = await factory.deploy(
      blocksPerDay,
      defaultRates,
      tokenContract.address
    );
    await sut.deployed();
  });

  describe("constructor", function () {
    it("should set the values based on the parameters and defaults", async function () {
      expect(await sut.emissionsActive()).to.eq(false);
      expect(await sut.blocksPerDay()).to.eq(blocksPerDay);
      expect(await sut.tokenAddress()).to.eq(tokenContract.address);
      expect(await sut.rewardRates(0)).to.eq(defaultRates[0]);
      expect(await sut.rewardRates(1)).to.eq(defaultRates[1]);
      expect(await sut.rewardRates(2)).to.eq(defaultRates[2]);
    });
  });

  describe("toggleEmissionsActive", function () {
    it("should toggle the emissionsActive value", async function () {
      const before = await sut.emissionsActive();
      await sut.toggleEmissionsActive();
      expect(await sut.emissionsActive()).to.eq(!before);
    });

    it("should only be callable by the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(sut.connect(other).toggleEmissionsActive()).to.be.reverted;
    });
  });

  describe("setBlocksPerDay", function () {
    it("should set the blocksPerDay value", async function () {
      const expected = BigNumber.from("6500");
      await sut.setBlocksPerDay(expected);
      expect(await sut.blocksPerDay()).to.eq(expected);
    });

    it("should only be callable by the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(sut.connect(other).setBlocksPerDay(BigNumber.from("6500")))
        .to.be.reverted;
    });
  });

  describe("setTokenAddress", function () {
    var otherToken;

    this.beforeEach(async function () {
      // Deploy a second token contract.
      const tokenFactory = await ethers.getContractFactory("Token");
      otherToken = await tokenFactory.deploy(defaultDecimals);
      await otherToken.deployed();
    });

    it("should set the tokenAddress value", async function () {
      const expected = otherToken.address;
      await sut.setTokenAddress(expected);
      expect(await sut.tokenAddress()).to.eq(expected);
    });

    it("should only be callable by the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(sut.connect(other).setTokenAddress(otherToken.address)).to.be
        .reverted;
    });
  });

  describe("setTokenRewardRateIndex", function () {
    it("should set the tokenRewardRateIndex value", async function () {
      const tokenId = 1;
      const index = 1;
      await sut.setTokenRewardRateIndex(tokenId, index);
      expect(await sut.tokenRewardRateIndex(tokenId)).to.eq(index);
    });

    it("should only be callable by the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(sut.connect(other).setTokenRewardRateIndex(1, 1)).to.be
        .reverted;
    });
  });

  describe("setMultipleTokenRewardRatesToIndex", function () {
    it("should set the tokenRewardRateIndex values", async function () {
      const tokenIds = [1, 2, 3];
      const index = 1;
      await sut.setMultipleTokenRewardRatesToIndex(tokenIds, index);
      expect(await sut.tokenRewardRateIndex(tokenIds[0])).to.eq(index);
      expect(await sut.tokenRewardRateIndex(tokenIds[1])).to.eq(index);
      expect(await sut.tokenRewardRateIndex(tokenIds[2])).to.eq(index);
    });

    it("should only be callable by the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(
        sut.connect(other).setMultipleTokenRewardRatesToIndex([1], 1)
      ).to.be.reverted;
    });
  });

  describe("setRewardRate", function () {
    it("should set the rewardRates value", async function () {
      const index = 1;
      const rate = 1;
      await sut.setRewardRate(index, rate);
      expect(await sut.rewardRates(index)).to.eq(rate);
    });

    it("should only be callable by the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(sut.connect(other).setRewardRate(1, 1)).to.be.reverted;
    });
  });

  describe("withdrawTokens", function () {
    context("contract has more than the requested tokens", function () {
      it("should send the requested amount of tokens to the caller", async function () {
        const [owner] = await ethers.getSigners();
        const originalBalance = await tokenContract.balanceOf(owner.address);
        const transferred = ethers.utils.parseUnits("1000", defaultDecimals);
        const withdraw = ethers.utils.parseUnits("500", defaultDecimals);

        // Transfer 1000 tokens to the sut contract.
        await tokenContract.transfer(sut.address, transferred);

        // Withdraw 500 tokens from the sut contract.
        await sut.withdrawTokens(withdraw);

        // Expect 500 tokens to remain in the sut contract.
        expect(await tokenContract.balanceOf(sut.address)).to.eq(
          ethers.utils.parseUnits("500", defaultDecimals)
        );

        // Expect the callers wallet to gain 500 tokens.
        expect(await tokenContract.balanceOf(owner.address)).to.eq(
          originalBalance.sub(transferred).add(withdraw)
        );
      });
    });

    context("contract has exactly the requested tokens", function () {
      it("should send the requested amount of tokens to the caller", async function () {
        const [owner] = await ethers.getSigners();
        const originalBalance = await tokenContract.balanceOf(owner.address);
        const transferred = ethers.utils.parseUnits("1000", defaultDecimals);
        const withdraw = ethers.utils.parseUnits("1000", defaultDecimals);

        // Transfer 1000 tokens to the sut contract.
        await tokenContract.transfer(sut.address, transferred);

        // Withdraw 1000 tokens from the sut contract.
        await sut.withdrawTokens(withdraw);

        // Expect 0 tokens to remain in the sut contract.
        expect(await tokenContract.balanceOf(sut.address)).to.eq(0);

        // Expect the callers wallet return to its original balance.
        expect(await tokenContract.balanceOf(owner.address)).to.eq(
          originalBalance
        );
      });
    });

    context("contract has less than the requested tokens", function () {
      it("should not transfer any tokens", async function () {
        const [owner] = await ethers.getSigners();
        const originalBalance = await tokenContract.balanceOf(owner.address);
        const transferred = ethers.utils.parseUnits("1000", defaultDecimals);
        const withdraw = ethers.utils.parseUnits("1500", defaultDecimals);

        // Transfer 1000 tokens to the sut contract.
        await tokenContract.transfer(sut.address, transferred);

        // Attempt to withdraw 1500 tokens from the sut contract.
        await sut.withdrawTokens(withdraw);

        // Expect 1000 tokens to remain in the sut contract.
        expect(await tokenContract.balanceOf(sut.address)).to.eq(transferred);

        // Expect the callers wallet to remain unchanged after the intial transfer.
        expect(await tokenContract.balanceOf(owner.address)).to.eq(
          originalBalance.sub(transferred)
        );
      });
    });

    it("should only be callable by the contract owner", async function () {
      const [_, other] = await ethers.getSigners();
      await expect(
        sut
          .connect(other)
          .withdrawTokens(ethers.utils.parseUnits("1000", defaultDecimals))
      ).to.be.reverted;
    });
  });

  describe("findRate", function () {
    var tokenId = 1;

    it("should respect the emissionsActive value", async function () {
      expect(await sut.emissionsActive()).to.eq(false);
      expect(await sut.findRate(tokenId)).to.eq(0);
    });

    context("emissions are active", function () {
      beforeEach(async function () {
        await sut.toggleEmissionsActive();
        expect(await sut.emissionsActive()).to.eq(true);
      });

      it("should be callable as any user", async function () {
        const [_, other] = await ethers.getSigners();
        expect(await sut.connect(other).findRate(tokenId)).to.eq(
          BigNumber.from("10000000000000000")
        );
      });

      it("should respect the tokenRewardRateIndex", async function () {
        await sut.setTokenRewardRateIndex(1, 1);

        expect(await sut.findRate(tokenId)).to.eq(
          BigNumber.from("20000000000000000")
        );
      });

      it("should respect the rewardRates", async function () {
        await sut.setRewardRate(0, 100);

        expect(await sut.findRate(tokenId)).to.eq(
          BigNumber.from("20000000000000000")
        );
      });

      it("should respect the blocksPerDay value", async function () {
        await sut.setBlocksPerDay(2500);

        expect(await sut.findRate(tokenId)).to.eq(
          BigNumber.from("20000000000000000")
        );
      });

      it("should respect the token decimals", async function () {
        const decimals = 6;
        const tokenFactory = await ethers.getContractFactory("Token");
        const sixDecimalToken = await tokenFactory.deploy(decimals);
        await sixDecimalToken.deployed();

        await sut.setTokenAddress(sixDecimalToken.address);

        expect(await sut.findRate(tokenId)).to.eq(BigNumber.from("10000"));
      });
    });
  });
});
