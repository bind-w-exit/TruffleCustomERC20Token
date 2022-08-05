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

    const ZERO_AMOUNT = new BN(0);
    const AMOUNT = new BN("1810272603723190928");

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

        describe("Distribution Contract Deploy Test Cases 🏗️", function () {

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

        describe("Owner Phase Test Cases 👮", function () {

            after(async function () {
                await snapshotB.restore();
            });

            //deposit method tests
            it("shouldn't transfer tokens to a contract from a not the current owner", async () => {
                await expectRevert(
                    distributionContract.deposit(AMOUNT, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't transfer tokens to a contract if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.deposit(ZERO_AMOUNT),
                    "The transaction amount is zero"
                );
            });

            //addBeneficiary
            it("should increase reward for the beneficiary", async () => {
                receipt = await distributionContract.addBeneficiary(user1, AMOUNT);
                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user1,
                        balanceBefore: ZERO_AMOUNT,
                        balanceAfter: AMOUNT
                    }
                );
            });

            it("shouldn't increase reward for beneficiary by not the current owner", async () => {
                await expectRevert(
                    distributionContract.addBeneficiary(user2, AMOUNT, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't increase reward for beneficiary with zero addresses", async () => {
                await expectRevert(
                    distributionContract.addBeneficiary(constants.ZERO_ADDRESS, AMOUNT),
                    "Reward can't be added to zero address"
                );
            });

            it("shouldn't increase reward for beneficiary if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.addBeneficiary(user1, ZERO_AMOUNT),
                    "The transaction amount is zero"
                );
            });
            
            //addBeneficiaries
            it("should increase rewards for the beneficiaries", async () => {
                receipt = await distributionContract.addBeneficiaries([user2, user3], [AMOUNT, AMOUNT]);

                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user2,
                        balanceBefore: ZERO_AMOUNT,
                        balanceAfter: AMOUNT
                    }
                );

                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user3,
                        balanceBefore: ZERO_AMOUNT,
                        balanceAfter: AMOUNT
                    }
                );
            });

            it("shouldn't increase rewards for beneficiaries by not the current owner", async () => {
                await expectRevert(
                    distributionContract.addBeneficiaries([user2], [AMOUNT], { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't increase rewards for beneficiaries if number of items in the arrays does't match", async () => {
                await expectRevert(
                    distributionContract.addBeneficiaries([user2, user3], [AMOUNT]),
                    "The number of items in the arrays does't match"
                );

                await expectRevert(
                    distributionContract.addBeneficiaries([user2], [AMOUNT, AMOUNT]),
                    "The number of items in the arrays does't match"
                );
            });

            //decreaseReward
            it("should decrease rewards for a beneficiary", async () => {
                receipt = await distributionContract.decreaseReward(user1, AMOUNT);
                expectEvent(
                    receipt,
                    "BeneficiaryBalanceChanged",
                    {
                        beneficiary: user1,
                        balanceBefore: AMOUNT,
                        balanceAfter: ZERO_AMOUNT
                    }
                );
            }); 

            it("shouldn't decrease reward for beneficiary by not the current owner", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(user2, AMOUNT, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't decrease reward for beneficiary with zero addresses", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(constants.ZERO_ADDRESS, AMOUNT),
                    "The reward tokens can't be removed from the zero address"
                );
            });

            it("shouldn't decrease reward for beneficiary if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(user1, ZERO_AMOUNT),
                    "The transaction amount is zero"
                );
            });

            it("shouldn't decrease reward for beneficiary if  amount exceeds beneficiary balance", async () => {
                await expectRevert(
                    distributionContract.decreaseReward(user1, AMOUNT),
                    "The amount of reward tokens that is removed exceeds beneficiary balance"
                );
            });

            //emergencyWithdraw
            it("shouldn't transfer tokens from contract to a not the current owner", async () => {
                await expectRevert(
                    distributionContract.emergencyWithdraw(AMOUNT, { from: user1 }),
                    "Ownable: caller is not the owner"
                );
            });

            it("shouldn't transfer tokens from contract if amount equal to zero", async () => {
                await expectRevert(
                    distributionContract.emergencyWithdraw(ZERO_AMOUNT),
                    "The transaction amount is zero"
                );
            });

            it("shouldn't transfer tokens from contract if amount exceeds total supply", async () => {
                await expectRevert(
                    distributionContract.emergencyWithdraw(AMOUNT),
                    "Withdraw amount of reward tokens exceeds total supply"
                );
            });
       
            //lockRewards
            it("should lock/unlock rewards for beneficiaries", async () => {
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

        describe("Deposit Phase Test Cases 💵", function () {

            before(async function () {
                await tevaToken.mint(deployer, AMOUNT);
                await tevaToken.approve(distributionContract.address, AMOUNT);
            });

            after(async function () {
                await snapshotB.restore();  //After ALL tests in "Deposit Phase Test Cases" reverts blockchain in the captured state
            });

            it("should transfer tokens to a contract from the current owner", async () => {
                receipt = await distributionContract.deposit(AMOUNT);
                expectEvent(
                    receipt,
                    "Deposit",
                    {
                        from: deployer,
                        amount: AMOUNT
                    }
                );
            });
        });

        describe("Withdraw Phase Test Cases (Users and owner) 💳", function () {

            before(async function () {
                await tevaToken.mint(deployer, AMOUNT);
                await tevaToken.approve(distributionContract.address, AMOUNT);
                await distributionContract.deposit(AMOUNT);
                snapshotC = await snapshot();
            });

            afterEach(async function () {
                await snapshotC.restore(); 
            });

            it("should transfer amount of reward tokens back to the owner", async () => {
                receipt = await distributionContract.emergencyWithdraw(AMOUNT);
                expectEvent(
                    receipt,
                    "EmergencyWithdraw",
                    {
                        to: deployer,
                        amount: AMOUNT
                    }
                );

                (await tevaToken.balanceOf(deployer)).should.be.bignumber.equal(AMOUNT);
            });

            it("should transfer tokens to beneficiary", async () => {
                await distributionContract.addBeneficiary(user1, AMOUNT);
                userBalance = await distributionContract.balanceOf(user1);
                userBalance.should.be.bignumber.equal(AMOUNT);

                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: AMOUNT
                    }
                );
                
                (await tevaToken.balanceOf(user1)).should.be.bignumber.equal(AMOUNT);
            });

            it("shouldn't transfer tokens to beneficiary if rewards for all beneficiaries has locked", async () => {
                await distributionContract.addBeneficiary(user1, AMOUNT);

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
                        amount: AMOUNT
                    }
                );
            });

            it("shouldn't transfer tokens to beneficiary if there are no reward tokens at this addresss", async () => {
                await expectRevert(
                    distributionContract.claim({ from: user1 }),
                    "There are no reward tokens in your address"
                );

                await distributionContract.addBeneficiary(user1, AMOUNT);
                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: AMOUNT
                    }
                );
            });

            it("shouldn't transfer tokens to beneficiary if not enough reward tokens in the contract total supply to withdraw them", async () => {
                await distributionContract.addBeneficiary(user1, AMOUNT);
                await distributionContract.emergencyWithdraw(AMOUNT);
                
                await expectRevert(
                    distributionContract.claim({ from: user1 }),
                    "Not enough reward tokens in the contract total supply to withdraw them"
                );
                
                await tevaToken.approve(distributionContract.address, AMOUNT);
                await distributionContract.deposit(AMOUNT);
                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: AMOUNT
                    }
                );
            });

        });
    });
});