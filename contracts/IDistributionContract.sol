// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface IDistributionContract {

    //Should transfer tokens from owner to distribution contract
    //Can be called only by the owner
    function deposit(uint256 amount) external returns (bool);

    //Rewards should be increased for the beneficiary.
    //Can be called only by the owner
    function addBeneficiaries(address[] memory beneficiaries, uint256[] memory amounts) external returns (bool);
    function addBeneficiary(address beneficiary, uint256 amount) external returns (bool);

    //Should decrease the amount of rewards for a beneficiary.
    //Can be called only by the owner
    function decreaseReward(address beneficiary, uint256 amount) external returns (bool);

    //Should transfer amount of reward tokens back to the owner.
    //Can be called only by the owner
    function emergencyWithdraw(uint256 amount) external returns (bool);

    //Should lock/unlock rewards for beneficiaries?
    //Can be called only by the owner
    function lockRewards(bool lock) external returns (bool);

    //Should transfer reward tokens to beneficiary. Without parameters.
    function claim() external returns (bool);

}