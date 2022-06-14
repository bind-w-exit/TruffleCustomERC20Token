// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IDistributionContract.sol";

contract DistributionContract is IDistributionContract, Ownable {
    using SafeERC20 for IERC20; 

    IERC20 public _token;
    bool public _rewardsIsLocked;
    uint256 public _totalSupply;

    mapping(address => uint256) private _balances;

    event BeneficiaryBalanceChanged(address beneficiary, uint256 balanceBefore, uint256 balanceAfter);
    event TotalSupplyChanged(uint256 totalSupplyBefore, uint256 TotalSuppleAfter);
    event EmergencyWithdraw(address to, uint256 amount);
    event Deposit(address from, uint256 amount);
    event Claim(address to, uint256 amount);
    event LockRewards(bool isLocked);
    
    /**
     * @dev Initializes the accepted token as a reward token.
     * @param token ERC-20 token.
     */
    constructor(IERC20 token) {
        require(address(token) != address(0), "Address of the contract should not be zero");
        _token = token;
    }

    /**
     * @dev Transfers tokens from owner to distribution contract.
     * Can only be called by the current owner.
     *
     * Emits an {TotalSupplyChanged} event that indicates that the total supply has changed.
     * Emits an {Deposit} event that indicates who and how many transferred reward tokens to the contract
     *
     * @param amount Amount of reward token.
     */
    function deposit(uint256 amount) external onlyOwner {
        require(amount > 0, "The transaction amount is zero");

        uint256 totalSupplyBefore = _totalSupply;
        _totalSupply += amount;
        _token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
        emit TotalSupplyChanged(totalSupplyBefore, _totalSupply);
    }

    /**
     * @dev Іncreases rewards for beneficiaries.
     * Can only be called by the current owner.
     *
     * @param beneficiaries Array of addresses of beneficiaries.
     * @param amounts Array of reward token amounts that will be added to the addresses of beneficiaries.
     */
    function addBeneficiaries(address[] calldata beneficiaries, uint256[] calldata amounts) external onlyOwner {
        require(beneficiaries.length == amounts.length, "The number of items in the arrays does't match");

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            addBeneficiary(beneficiaries[i], amounts[i]);
        }
    }

    /**
     * @dev Іncreases reward for the beneficiary.
     * Can only be called by the current owner.
     *
     * Emits an {BeneficiaryBalanceChanged} event that indicates that the beneficiary balance has changed.
     *
     * @param beneficiary Beneficiary address.
     * @param amount Amount of reward tokens that will be added to the beneficiary address.
     */
    function addBeneficiary(address beneficiary, uint256 amount) public onlyOwner {
        require(beneficiary != address(0), "Reward can't be added to zero address");
        require(amount > 0, "The transaction amount is zero");

        uint256 balanceBefore = _balances[beneficiary];
        _balances[beneficiary]  += amount;
        emit BeneficiaryBalanceChanged(beneficiary, balanceBefore, _balances[beneficiary]);
    }

    /**
     * @dev Decreases rewards for the beneficiary.
     * Can only be called by the current owner.
     *
     * Emits an {BeneficiaryBalanceChanged} event that indicates that the beneficiary balance has changed.
     *
     * @param beneficiary Beneficiary address.
     * @param amount Amount of reward tokens that will be removed from the beneficiary's address.
     */
    function decreaseReward(address beneficiary, uint256 amount) external onlyOwner {
        require(beneficiary != address(0), "The reward tokens can't be removed from the zero address");
        require(amount > 0, "The transaction amount is zero");
        require(_balances[beneficiary] >= amount, "The amount of reward tokens that is removed exceeds beneficiary balance");

        uint256 balanceBefore = _balances[beneficiary];
        _balances[beneficiary]  -= amount;
        emit BeneficiaryBalanceChanged(beneficiary, balanceBefore, _balances[beneficiary]);
    }

    /**
     * @dev Transfers the amount of reward tokens back to the owner.
     * Can only be called by the current owner.
     *
     * Emits an {TotalSupplyChanged} event that indicates that the total supply has changed.
     * Emits an {EmergencyWithdraw} event that indicates who and how much withdraw reward tokens from the contract.
     *
     * @param amount Amount of reward tokens.
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "The transaction amount is zero");
        require(_totalSupply >= amount, "Withdraw amount of reward tokens exceeds total supply");

        uint256 totalSupplyBefore = _totalSupply;
        _totalSupply -= amount;
        _token.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, amount);
        emit TotalSupplyChanged(totalSupplyBefore, _totalSupply);
    }

    /**
     * @dev Lock/unlock rewards for beneficiaries.
     * Can only be called by the current owner.
     *
     * Emits an {LockRewards} event that indicates a change in the rewards payment permit.
     *
     * @param lock lock/unlock rewards payment permit.
     */
    function lockRewards(bool lock) external onlyOwner {
        _rewardsIsLocked = lock;
        emit LockRewards(_rewardsIsLocked);
    }

    /**
     * @dev Transfers reward tokens to beneficiary.
     * Without parameters.
     *
     * Emits an {TotalSupplyChanged} event that indicates that the total supply has changed.
     * Emits an {Claim} event that indicates who and how much withdraw reward tokens from the contract.
     */
    function claim() external {
        require(_rewardsIsLocked == false, "Rewards for all beneficiaries has locked");
        require(_balances[msg.sender] > 0, "There are no reward tokens in your address");
        require(_totalSupply >= _balances[msg.sender], "Not enough reward tokens in the contract total supply to withdraw them");

        uint256 totalSupplyBefore = _totalSupply;
        uint256 amount = _balances[msg.sender];
        _totalSupply -= _balances[msg.sender];  
        _balances[msg.sender] = 0;     
        _token.safeTransfer(msg.sender, amount);  
        emit Claim(msg.sender, amount);  
        emit TotalSupplyChanged(totalSupplyBefore, _totalSupply);
    }

    /**
     * @dev Check the beneficiary's balance
     * Without parameters.
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

}