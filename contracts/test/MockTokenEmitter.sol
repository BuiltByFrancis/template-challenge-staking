// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../ERC20WithDecimals.sol";
import "../TokenEmitter.sol";

/**
 * @dev Implementation of the {TokenEmitter} abstract contract for testing purposes.
 */
contract MockTokenEmitter is TokenEmitter {
    /**
     * @dev Initializes the contract by passing the parameters to the base class.
     */
    constructor(
        uint256 blocksPerDay_,
        uint256[] memory defaultRates_,
        ERC20WithDecimals tokenAddress_
    ) TokenEmitter(blocksPerDay_, defaultRates_, tokenAddress_) {}
}
