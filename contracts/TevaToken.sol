// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TevaToken is ERC20, Ownable {
    constructor() ERC20("Teva token", "TEVA") {}

    function mint(address account, uint256 amount) public onlyOwner returns (bool) {    
        _mint(account, amount);
        return true;
    }

    function burn(address account, uint256 amount) public onlyOwner returns (bool) {    
        _burn(account, amount);
        return true;
    }

}