const TevaToken = artifacts.require("./TevaToken.sol");
const DistributionContract = artifacts.require("./DistributionContract.sol")

module.exports = async function(deployer) {
  await deployer.deploy(TevaToken);
  await deployer.deploy(DistributionContract, TevaToken.address);
};
