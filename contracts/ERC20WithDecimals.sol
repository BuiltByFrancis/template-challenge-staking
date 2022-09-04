// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract ERC20WithDecimals is IERC20 {
    function decimals() public view virtual returns (uint8);
}