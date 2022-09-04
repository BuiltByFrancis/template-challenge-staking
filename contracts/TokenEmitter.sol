// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20WithDecimals.sol";

abstract contract TokenEmitter is Ownable {
    event TokensClaimed(
        address user,
        uint256[] tokenIds,
        uint256 totalReward,
        uint256 blockNumber
    );

    bool public emissionsActive;
    uint256 public blocksPerDay;
    ERC20WithDecimals public tokenAddress;
    mapping(uint256 => uint256) public tokenRewardRateIndex;
    mapping(uint256 => uint256) public rewardRates;

    constructor(
        uint256 blocksPerDay_,
        uint256[] memory defaultRates_,
        ERC20WithDecimals tokenAddress_
    ) {}

    function toggleEmissionsActive() external onlyOwner {}

    function setBlocksPerDay(uint256 _blocksPerDay) external onlyOwner {}

    function setTokenAddress(ERC20WithDecimals _newTokenAddress)
        external
        onlyOwner
    {}

    function setTokenRewardRateIndex(uint256 tokenId, uint256 index)
        external
        onlyOwner
    {}

    function setMultipleTokenRewardRatesToIndex(
        uint256[] memory _tokenIds,
        uint256 index
    ) external onlyOwner {}

    function setRewardRate(uint256 index, uint256 rate) external onlyOwner {}

    function withdrawTokens(uint256 amount) external onlyOwner {}

    function findRate(uint256 tokenId) external view returns (uint256 rate) {}

    function _findRate(uint256 tokenId) internal view returns (uint256 rate) {}

    function _safeTransferRewards(address recipient, uint256 amount) internal {}

    function _decimalMultiplier() private view returns (uint256) {}
}
