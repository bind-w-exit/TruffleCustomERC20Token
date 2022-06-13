const {
    BN,
    expectEvent,
    constants,
    expectRevert,
    snapshot
} = require("@openzeppelin/test-helpers");


require("chai")
    .use(require("chai-as-promised"))
    .use(require("chai-bn")(BN))
    .should();


const DistributionContract = artifacts.require("DistributionContract.sol");
const TevaToken = artifacts.require("TevaToken.sol");

contract("DistributionContract", function(accounts) {
    [deployer, user1, user2, user3] = accounts;

    const zeroAmount = new BN(0);
    const amount = new BN(100000);
    

    before(async function () {
        snapshotA = await snapshot();
        tevaToken = await TevaToken.new();
        distributionContract = await DistributionContract.new(tevaToken.address);

        snapshotB = await snapshot();
    });

    after(async function () {
        await snapshotA.restore();  //After ALL tests in "Distribution Contract Test Cases" reverts blockchain in the captured state
    });

    describe("Distribution Contract Test Cases", function () {

        describe("Distribution Contract Deploy Test Cases", function () {

            it("shouldn't deploy contract if the token address is zero", async () => {
                await expectRevert(
                    DistributionContract.new(constants.ZERO_ADDRESS),
                    "Address of the contract should not be zero"
                );
            });

            it("should deploy with correct owner", async () => {
                (await distributionContract.owner()).should.equal(deployer);
            });
        });

        describe("Owner Phase Test Cases", function () {

            afterEach(async function () {
                await snapshotB.restore();
            });

            //deposit method tests
            it("shouldn't transfer tokens to a contract from a not the current owner", async () => {
                await expectRevert(
                    distributionContract.deposit(amount, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't transfer tokens to a contract if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.deposit(zeroAmount),
                    "The transaction amount is zero"
                );
            });

            //addBeneficiary method tests
            it("should increase reward for the beneficiary", async () => {
                receipt = await distributionContract.addBeneficiary(user1, amount);
                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user1,
                        balanceBefore: zeroAmount,
                        balanceAfter: amount
                    }
                );
            });

            it("shouldn't increase reward for beneficiary by not the current owner", async () => {
                await expectRevert(
                    distributionContract.addBeneficiary(user2, amount, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't increase reward for beneficiary with zero addresses", async () => {
                await expectRevert(
                    distributionContract.addBeneficiary(constants.ZERO_ADDRESS, amount),
                    "Reward can't be added to zero address"
                );
            });

            it("shouldn't increase reward for beneficiary if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.addBeneficiary(user1, zeroAmount),
                    "The transaction amount is zero"
                );
            });
            
            //addBeneficiaries method tests 
            it("should increase rewards for the beneficiaries", async () => {
                receipt = await distributionContract.addBeneficiaries([user2, user3], [amount, amount]);

                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user2,
                        balanceBefore: zeroAmount,
                        balanceAfter: amount
                    }
                );

                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user3,
                        balanceBefore: zeroAmount,
                        balanceAfter: amount
                    }
                );
            });

            it("shouldn't increase rewards for beneficiaries by not the current owner", async () => {
                await expectRevert(
                    distributionContract.addBeneficiaries([user2], [amount], { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't increase rewards for beneficiaries if number of items in the arrays does't match", async () => {
                await expectRevert(
                    distributionContract.addBeneficiaries([user2, user3], [amount]),
                    "The number of items in the arrays does't match"
                );

                await expectRevert(
                    distributionContract.addBeneficiaries([user2], [amount, amount]),
                    "The number of items in the arrays does't match"
                );
            });

            //decreaseReward method tests 
            it("Should decrease rewards for a beneficiary", async () => {
                await distributionContract.addBeneficiary(user1, amount);
                receipt = await distributionContract.decreaseReward(user1, amount);
                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user1,
                        balanceBefore: amount,
                        balanceAfter: zeroAmount
                    }
                );
            }); 

            it("shouldn't decrease reward for beneficiary by not the current owner", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(user2, amount, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't decrease reward for beneficiary with zero addresses", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(constants.ZERO_ADDRESS, amount),
                    "The reward tokens can't be removed from the zero address"
                );
            });

            it("shouldn't decrease reward for beneficiary if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(user1, zeroAmount),
                    "The transaction amount is zero"
                );
            });

            it("shouldn't decrease reward for beneficiary if  amount exceeds beneficiary balance", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(user1, amount),
                    "The amount of reward tokens that is removed exceeds beneficiary balance"
                );
            });

            //emergencyWithdraw method tests 
            it("shouldn't transfer tokens from contract to a not the current owner", async () => {
                await expectRevert(
                    distributionContract.emergencyWithdraw(amount, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't transfer tokens from contract if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.emergencyWithdraw(zeroAmount),
                    "The transaction amount is zero"
                );
            });

            it("shouldn't transfer tokens from contract if amount exceeds total supply", async () => {
                await expectRevert(
                    distributionContract.emergencyWithdraw(amount),
                    "Withdraw amount of reward tokens exceeds total supply"
                );
            });
       
            //lockRewards method tests 
            it("Should lock/unlock rewards for beneficiaries", async () => {
                receipt = await distributionContract.lockRewards(true);
                expectEvent(
                    receipt,
                    "LockRewards",
                    {
                        isLocked: true
                    }
                );

                receipt = await distributionContract.lockRewards(false);
                expectEvent(
                    receipt,
                    "LockRewards",
                    {
                        isLocked: false
                    }
                );
            });

            it("shouldn't lock/unlock rewards for beneficiaries by a not the current owner", async () => {
                await expectRevert(
                    distributionContract.lockRewards(true, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });
        });

        describe("Deposit Phase Test Cases", function () {

            before(async function () {
                await tevaToken.mint(deployer, amount);
                await tevaToken.approve(distributionContract.address, amount);
            });

            after(async function () {
                await snapshotB.restore();  //After ALL tests in "Deposit Phase Test Cases" reverts blockchain in the captured state
            });

            it("should transfer tokens to a contract from the current owner", async () => {
                receipt = await distributionContract.deposit(amount);
                expectEvent(
                    receipt,
                    "Deposit",
                    {
                        from: deployer,
                        amount: amount
                    }
                );
            });
        });

        describe("Withdraw Phase Test Cases (Users and owner)", function () {

            before(async function () {
                await tevaToken.mint(deployer, amount);
                await tevaToken.approve(distributionContract.address, amount);
                await distributionContract.deposit(amount);
                snapshotC = await snapshot();
            });

            afterEach(async function () {
                await snapshotC.restore(); 
            });

            it("Should transfer amount of reward tokens back to the owner", async () => {
                receipt = await distributionContract.emergencyWithdraw(amount);
                expectEvent(
                    receipt,
                    "EmergencyWithdraw",
                    {
                        to: deployer,
                        amount: amount
                    }
                );

                userBalance = await tevaToken.balanceOf(deployer);
                userBalance.should.be.bignumber.equal(amount);
            });

            it("should transfer tokens to beneficiary", async () => {
                await distributionContract.addBeneficiary(user1, amount); //this method has be tested in "Owner Phase Test Cases"
                userBalance = await distributionContract.balanceOf(user1);
                userBalance.should.be.bignumber.equal(amount);

                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: amount
                    }
                );
                
                userBalance = await tevaToken.balanceOf(user1);
                userBalance.should.be.bignumber.equal(amount);
            });

            it("shouldn't transfer tokens to beneficiary if rewards for all beneficiaries has locked", async () => {
                await distributionContract.addBeneficiary(user1, amount);

                await distributionContract.lockRewards(true);
                await expectRevert(
                    distributionContract.claim({ from: user1 }),
                    "Rewards for all beneficiaries has locked"
                );

                await distributionContract.lockRewards(false);
                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: amount
                    }
                );
            });

            it("shouldn't transfer tokens to beneficiary if there are no reward tokens at this addresss", async () => {
                await expectRevert(
                    distributionContract.claim({ from: user1 }),
                    "There are no reward tokens in your address"
                );

                await distributionContract.addBeneficiary(user1, amount);
                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: amount
                    }
                );
            });

            it("shouldn't transfer tokens to beneficiary if not enough reward tokens in the contract total supply to withdraw them", async () => {
                await distributionContract.addBeneficiary(user1, amount);
                await distributionContract.emergencyWithdraw(amount);
                
                await expectRevert(
                    distributionContract.claim({ from: user1 }),
                    "Not enough reward tokens in the contract total supply to withdraw them"
                );
                
                await tevaToken.approve(distributionContract.address, amount);
                await distributionContract.deposit(amount);
                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: amount
                    }
                );
            });


        });
    });
});