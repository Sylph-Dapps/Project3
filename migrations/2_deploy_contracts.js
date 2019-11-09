var SimpleStorageContract = artifacts.require("SimpleStorage.sol");

module.exports = async function(deployer) {
  deployer.deploy(SimpleStorageContract, (new Date(2019, 11, 7).getTime() / 1000));
};

