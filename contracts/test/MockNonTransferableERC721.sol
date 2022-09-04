// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../NonTransferableERC721.sol";

/**
 * @dev Implementation of the {NonTransferableERC721} abstract contract for testing purposes.
 */
contract MockNonTransferableERC721 is NonTransferableERC721 {
    /**
     * @dev Initializes the contract
     */
    constructor() ERC721("mock", "M") {}

    /**
     * @dev Mints a single nft with the token Id 1 to the callers wallet.
     */
    function MintSingle() external {
        _safeMint(msg.sender, 1);
    }

    /**
     * @dev Mints a single nft with the token Id 1 to the callers wallet.
     * Then immediately burns the nft from the wallet.
     */
    function MintThenBurnSingle() external {
        _safeMint(msg.sender, 1);
        _burn(1);
    }
}
