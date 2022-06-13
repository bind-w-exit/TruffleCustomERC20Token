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


const TevaToken = artifacts.require("TevaToken.sol");

contract("TevaToken", function (accounts) {
    [deployer, user1, user2, user3] = accounts;
    const name = "Teva token";
    const symbol = "TEVA";
    const decimals = new BN(18);
    const amount = new BN(100000);

    before(async function () {
        tevaToken = await TevaToken.new();
    });

    describe("Teva Token Test Cases", function () {

        describe("Teva Token Deploy Test Cases", function () {

            it("should deploy with correct owner", async () => {
                (await tevaToken.owner()).should.equal(deployer);
            });

            it("should deploy with correct name", async () => {
                (await tevaToken.name()).should.equal(name);
            });

            it("should deploy with correct symbol", async () => {
                (await tevaToken.symbol()).should.equal(symbol);
            });

            it("should deploy with correct decimals", async () => {
                (await tevaToken.decimals()).should.be.bignumber.equal(decimals);
            });

            it("should deploy with correct initial total supply", async () => {
                (await tevaToken.totalSupply()).should.be.bignumber.equal(new BN(0));
            });

        });

        describe("Teva Token Test Cases", function () {

        });
    });
});