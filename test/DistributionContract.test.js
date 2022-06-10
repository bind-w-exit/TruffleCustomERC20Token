const {
    BN,
    time,
    expect,
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

        describe("Withdraw Phase Test Cases", function () {

            before(async function () {
                await tevaToken.mint(deployer, amount);
                await tevaToken.approve(distributionContract.address, amount);
                await distributionContract.deposit(amount);
                snapshotC = await snapshot();
            });

            afterEach(async function () {
                await snapshotC.restore(); 
            });

            it("should transfer tokens to beneficiary", async() => {
                await distributionContract.addBeneficiary(user1, amount); //this method has be tested in "Owner Phase Test Cases"
                receipt = await distributionContract.claim({from: user1});
                expectEvent(
                    receipt,
                    "Claim",
                    {
                        to: user1,
                        amount: amount
                    }
                );

                //await tevaToken.balanceOf(user1).should.eventually.be.bignumber.equal(amount);
            });

        });
    });
});

// contract("Distribution contract", function(accounts) {

//     it("Should transfer tokens from owner to distribution contract", async () => {
//         await expect(tevaTokenInstance.balanceOf(distributionContractInstance.address)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS));
//     });

//     it("Should transfer reward tokens to beneficiary", async() => {
//         await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS);
//         await distributionContractInstance.claim({from: recipient});
//         await expect(tevaTokenInstance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS));
//     });

//     it("Should transfer reward tokens to beneficiaries", async() => {
//         await distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS/2]);
//         await distributionContractInstance.claim({from: recipient});
//         await distributionContractInstance.claim({from: anotherAccount});
//         await expect(tevaTokenInstance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS/2));
//         await expect(tevaTokenInstance.balanceOf(anotherAccount)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS/2));
//     });

//     it("Reduction of the amount of reward should not exceed the balance", async() => {
//         await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS - 1);
//         await expect(distributionContractInstance.decreaseReward(recipient, SEND_TOKENS)).to.eventually.be.rejected;
//     });

//     it("Should decrease the amount of rewards for a beneficiary", async() => {
//         await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS);
//         await expect(distributionContractInstance.decreaseReward(recipient, SEND_TOKENS)).to.eventually.be.fulfilled;
//     });

//     it("The amount of withdrawal of reward should not exceed the balance", async() => {
//         await expect(distributionContractInstance.emergencyWithdraw(SEND_TOKENS + 1)).to.eventually.be.rejected;
//     });

//     it("Should transfer amount of reward tokens back to the owner", async() => {
//         await expect(distributionContractInstance.emergencyWithdraw(SEND_TOKENS)).to.eventually.be.fulfilled;
//     });

//     it("Should lock/unlock rewards for beneficiaries", async() => {
//         await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS);
    
//         await distributionContractInstance.lockRewards(true);
//         await expect(distributionContractInstance.claim({from: recipient})).to.eventually.be.rejected;

//         await distributionContractInstance.lockRewards(false);
//         await expect(distributionContractInstance.claim({from: recipient})).to.eventually.be.fulfilled;
//     });

//     it("Not enough tokens in the contract", async() => {
//         await distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS]);
//         await expect(distributionContractInstance.claim({from: recipient})).to.eventually.be.fulfilled;
//         await expect(distributionContractInstance.claim({from: anotherAccount})).to.eventually.be.rejected;
//     })

//     it("Only the owner can call the functions", async() => {
//         await tevaTokenInstance.mint(recipient, SEND_TOKENS);
//         await expect(this.distributionContractInstance.deposit(SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;


//         await expect(distributionContractInstance.addBeneficiary(anotherAccount, SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;
//         await expect(distributionContractInstance.addBeneficiaries([anotherAccount], [SEND_TOKENS], {from: recipient})).to.eventually.be.rejected;
//         await expect(distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS/2], {from: recipient})).to.eventually.be.rejected;

//         await expect(distributionContractInstance.decreaseReward(anotherAccount, SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;

//         await expect(distributionContractInstance.emergencyWithdraw(SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;

//         await expect(distributionContractInstance.lockRewards(true, {from: recipient})).to.eventually.be.rejected;
//         await expect(distributionContractInstance.lockRewards(false, {from: recipient})).to.eventually.be.rejected;
//     });
// });