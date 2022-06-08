const DistributionContract = artifacts.require("DistributionContract.sol");
const TevaToken = artifacts.require("TevaToken.sol");

const chai = require('chai');

const BN = web3.utils.BN;
const chaiBN = require('chai-bn')(BN);
chai.use(chaiBN);

const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;



contract("Distribution contract", function(accounts) {

    const [ initialHolder, recipient, anotherAccount ] = accounts;
    const SEND_TOKENS = 100000;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

    before("Create TEVA token instance", async () => {
        this.tevaTokenInstance = await TevaToken.deployed();
    });

    beforeEach("Transfer tokens from owner to distribution contract", async () => {
        let recipientBalance = await tevaTokenInstance.balanceOf(recipient);
        let anotherAccountBalance = await tevaTokenInstance.balanceOf(anotherAccount);
        await tevaTokenInstance.burn(recipient, recipientBalance);
        await tevaTokenInstance.burn(anotherAccount, anotherAccountBalance);
        
        this.distributionContractInstance = await DistributionContract.new(TevaToken.address);
        
        await tevaTokenInstance.mint(initialHolder, SEND_TOKENS);
        await tevaTokenInstance.approve(distributionContractInstance.address, SEND_TOKENS);
        await distributionContractInstance.deposit(SEND_TOKENS);
    });

    it("Should transfer tokens from owner to distribution contract", async () => {
        await expect(tevaTokenInstance.balanceOf(distributionContractInstance.address)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS));
    });

    it("The amount of reward should not be increased for a zero address", async() =>{ 
        await expect(distributionContractInstance.addBeneficiary(ZERO_ADDRESS, SEND_TOKENS)).to.eventually.be.rejected;
        await expect(distributionContractInstance.addBeneficiaries([recipient, ZERO_ADDRESS], [SEND_TOKENS/2, SEND_TOKENS/2])).to.eventually.be.rejected;
    });

    it("Rewards should be increased for the beneficiary", async() => {
        await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS);
        await expect(distributionContractInstance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS));
    });

    it("Should transfer reward tokens to beneficiary", async() => {
        await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS);
        await distributionContractInstance.claim({from: recipient});
        await expect(tevaTokenInstance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS));
    });

    it("The number of items in the array of beneficiaries and the amounts must match", async() =>{ 
        await expect(distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2])).to.eventually.be.rejected;
        await expect(distributionContractInstance.addBeneficiaries([recipient], [SEND_TOKENS/2, SEND_TOKENS/2])).to.eventually.be.rejected;
        await expect(distributionContractInstance.addBeneficiaries([recipient], [SEND_TOKENS])).to.eventually.be.fulfilled;
        await expect(distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS/2])).to.eventually.be.fulfilled;
    });

    it("Rewards should be increased for the beneficiaries", async() => {
        await distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS/2]);
        await expect(distributionContractInstance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS/2));
        await expect(distributionContractInstance.balanceOf(anotherAccount)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS/2));
    });

    it("Should transfer reward tokens to beneficiaries", async() => {
        await distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS/2]);
        await distributionContractInstance.claim({from: recipient});
        await distributionContractInstance.claim({from: anotherAccount});
        await expect(tevaTokenInstance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS/2));
        await expect(tevaTokenInstance.balanceOf(anotherAccount)).to.eventually.be.a.bignumber.equal(new BN(SEND_TOKENS/2));
    });

    it("Reward amount cannot be reduced for zero address", async() => {
        await expect(distributionContractInstance.decreaseReward(ZERO_ADDRESS, 0)).to.eventually.be.rejected;
    });

    it("Reduction of the amount of reward should not exceed the balance", async() => {
        await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS - 1);
        await expect(distributionContractInstance.decreaseReward(recipient, SEND_TOKENS)).to.eventually.be.rejected;
    });

    it("Should decrease the amount of rewards for a beneficiary", async() => {
        await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS);
        await expect(distributionContractInstance.decreaseReward(recipient, SEND_TOKENS)).to.eventually.be.fulfilled;
    });

    it("The amount of withdrawal of reward should not exceed the balance", async() => {
        await expect(distributionContractInstance.emergencyWithdraw(SEND_TOKENS + 1)).to.eventually.be.rejected;
    });

    it("Should transfer amount of reward tokens back to the owner", async() => {
        await expect(distributionContractInstance.emergencyWithdraw(SEND_TOKENS)).to.eventually.be.fulfilled;
    });

    it("Should lock/unlock rewards for beneficiaries", async() => {
        await distributionContractInstance.addBeneficiary(recipient, SEND_TOKENS);
    
        await distributionContractInstance.lockRewards(true);
        await expect(distributionContractInstance.claim({from: recipient})).to.eventually.be.rejected;

        await distributionContractInstance.lockRewards(false);
        await expect(distributionContractInstance.claim({from: recipient})).to.eventually.be.fulfilled;
    });

    it("Not enough tokens in the contract", async() => {
        await distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS]);
        await expect(distributionContractInstance.claim({from: recipient})).to.eventually.be.fulfilled;
        await expect(distributionContractInstance.claim({from: anotherAccount})).to.eventually.be.rejected;
    })

    it("Only the owner can call the functions", async() => {
        await tevaTokenInstance.mint(recipient, SEND_TOKENS);
        await expect(this.distributionContractInstance.deposit(SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;


        await expect(distributionContractInstance.addBeneficiary(anotherAccount, SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;
        await expect(distributionContractInstance.addBeneficiaries([anotherAccount], [SEND_TOKENS], {from: recipient})).to.eventually.be.rejected;
        await expect(distributionContractInstance.addBeneficiaries([recipient, anotherAccount], [SEND_TOKENS/2, SEND_TOKENS/2], {from: recipient})).to.eventually.be.rejected;

        await expect(distributionContractInstance.decreaseReward(anotherAccount, SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;

        await expect(distributionContractInstance.emergencyWithdraw(SEND_TOKENS, {from: recipient})).to.eventually.be.rejected;

        await expect(distributionContractInstance.lockRewards(true, {from: recipient})).to.eventually.be.rejected;
        await expect(distributionContractInstance.lockRewards(false, {from: recipient})).to.eventually.be.rejected;
    });
});