// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IDistributionContract.sol";
import "./TevaToken.sol";


contract DistributionContract is IDistributionContract, Ownable {

    IERC20 private _token;
    bool private _rewardsIsLocked;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;

    constructor (IERC20 token) {
        _token = token;
    }

    //Should transfer tokens from owner to distribution contract
    //Can be called only by the owner
    function deposit(uint256 amount) public onlyOwner returns (bool) {
        _token.transferFrom(_msgSender(), address(this), amount);
        _totalSupply += amount;
        return true;
    }

    //Rewards should be increased for the beneficiaries.
    //Can be called only by the owner
    function addBeneficiaries(address[] memory beneficiaries, uint256[] memory amounts) onlyOwner public returns (bool) {
        require(beneficiaries.length == amounts.length, "The number of items in the array of beneficiaries and the amounts must match");

        for(uint256 i = 0; i < beneficiaries.length; i++){
            addBeneficiary(beneficiaries[i], amounts[i]);
        }
        return true;
    }

    //Rewards should be increased for the beneficiary.
    //Can be called only by the owner
    function addBeneficiary(address beneficiary, uint256 amount) public onlyOwner returns (bool) {
        require(beneficiary != address(0), "Reward amount increased for zero address");

        _balances[beneficiary]  += amount;
        return true;
    }

    //Should decrease the amount of rewards for a beneficiary.
    //Can be called only by the owner
    function decreaseReward(address beneficiary, uint256 amount) public onlyOwner returns (bool){
        require(beneficiary != address(0), "Reward amount reduced for zero address");
        require(_balances[beneficiary] >= amount, "Decrease amount of rewards exceeds balance");

        _balances[beneficiary]  -= amount;
        return true;
    }

    //Should transfer amount of reward tokens back to the owner.
    //Can be called only by the owner
    function emergencyWithdraw(uint256 amount) public onlyOwner returns (bool) {
        require(_totalSupply >= amount, "Withdraw amount of rewards exceeds balance");

        _token.transfer(msg.sender, amount);
        return true;
    }

    //Should lock/unlock rewards for beneficiaries?
    //Can be called only by the owner
    function lockRewards(bool lock) public onlyOwner returns (bool) {
        _rewardsIsLocked = lock;
        return true;
    }

    //Should transfer reward tokens to beneficiary. Without parameters.
    function claim() public returns (bool) {
        require(_rewardsIsLocked == false, "Rewards for beneficiaries has locked");
        require(_totalSupply >= _balances[msg.sender], "Not enough tokens in the contract");


        _token.transfer(msg.sender, _balances[msg.sender]);
        _totalSupply -= _balances[msg.sender];
        _balances[msg.sender] = 0;

        return true;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

}