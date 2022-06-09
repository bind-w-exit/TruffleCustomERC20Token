// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface IDistributionContract {

    /**
     * @dev Transfers tokens from owner to distribution contract.
     * @param amount Amount of reward token.
     */
    function deposit(uint256 amount) external;

    /**
     * @dev Іncreases rewards for beneficiaries.
     * @param beneficiaries Array of addresses of beneficiaries.
     * @param amounts Array of reward token amounts that will be added to the addresses of beneficiaries.
     */
    function addBeneficiaries(address[] calldata beneficiaries, uint256[] calldata amounts) external;

    /**
     * @dev Іncreases reward for the beneficiary.
     * @param beneficiary Beneficiary address.
     * @param amount Amount of reward tokens that will be added to the beneficiary address.
     */
    function addBeneficiary(address beneficiary, uint256 amount) external;

    /**
     * @dev Decreases rewards for the beneficiary.
     * @param beneficiary Beneficiary address.
     * @param amount Amount of reward tokens that will be removed from the beneficiary's address.
     */
    function decreaseReward(address beneficiary, uint256 amount) external;

    /**
     * @dev Transfers the amount of reward tokens back to the owner.
     * @param amount Amount of reward tokens.
     */
    function emergencyWithdraw(uint256 amount) external;

    /**
     * @dev Lock/unlock rewards for beneficiaries.
     * @param lock lock/unlock rewards payment permit.
     */
    function lockRewards(bool lock) external;

    /**
     * @dev Transfers reward tokens to beneficiary.
     * Without parameters.
     */
    function claim() external;

}