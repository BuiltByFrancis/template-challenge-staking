// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract NonTransferableERC721 is ERC721 {
    error NonTransferable();
    error NonApprovable();

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {}

    function approve(address, uint256) public virtual override {}

    function setApprovalForAll(address, bool) public virtual override {}
}
