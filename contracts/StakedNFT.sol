// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./TokenEmitter.sol";
import "./ERC20WithDecimals.sol";
import "./NonTransferableERC721.sol";

contract StakedNFT is TokenEmitter, NonTransferableERC721, IERC721Receiver {
    using Math for uint256;

    error MissingToken(uint256 tokenId);
    error NotTokenOwner(uint256 tokenId);

    IERC721 public nftAddress;
    uint256 public finalRewardBlock;
    mapping(uint256 => uint256) public lastClaimedAt;

    constructor(
        IERC721 nftAddress_,
        uint256 blocksPerDay_,
        uint256[] memory defaultRates_,
        ERC20WithDecimals tokenAddress_
    )
        TokenEmitter(blocksPerDay_, defaultRates_, tokenAddress_)
        ERC721("StakedNFT", "sNFT")
    {}

    function depositsOf(address account)
        external
        view
        returns (uint256[] memory)
    {}

    function lastClaimsOf(uint256[] memory tokenIds)
        external
        view
        returns (uint256[] memory)
    {}

    function calculateRewards(address account, uint256[] memory tokenIds)
        external
        view
        returns (uint256[] memory rewards)
    {}

    function calculateReward(address account, uint256 tokenId)
        external
        view
        returns (uint256 total)
    {}

    function stake(uint256[] calldata tokenIds) external {}

    function unstake(uint256[] calldata tokenIds) external {}

    function claimRewards(uint256[] calldata tokenIds) external {}

    function _claimRewards(uint256[] calldata tokenIds) private {}

    function _calculateReward(address account, uint256 tokenId)
        private
        view
        returns (uint256 total)
    {}

    function setNFTAddress(IERC721 _newNFTAdress) external {}

    function setFinalRewardBlock(uint256 _finalRewardBlock) external {}

    function _revertOnMissingToken(uint256 tokenId) private view {}

    function _revertOnNotTokenOwner(uint256 tokenId, address interactor)
        private
        view
    {}

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {}
}
