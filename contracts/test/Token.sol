// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Implementation of the {ERC20} contract for testing purposes.
 */
contract Token is ERC20 {
    uint8 private _decimals;
    uint256 public constant maxTotalSupply = 10000 * 10**18;

    /**
     * @dev Initializes the contract and sets the values for {_decimals}.
     */
    constructor(uint8 tokenDecimals) ERC20("RewardToken", "RT") {
        _decimals = tokenDecimals;
        _mint(msg.sender, maxTotalSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
