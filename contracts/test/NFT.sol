// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @dev Implementation of the {ERC721} contract for testing purposes.
 */
contract NFT is ERC721 {
    uint256 private index;

    /**
     * @dev Initializes the contract
     */
    constructor() ERC721("NonFunctionalTweet", "NFT") {}

    /**
     * @dev Mints a single nft with the next available token id to the callers wallet.
     */
    function Mint() external {
        unchecked {
            index++;
        }
        _safeMint(msg.sender, index);
    }
}
