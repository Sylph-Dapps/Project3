const SimpleStorageContract = artifacts.require("./SimpleStorage.sol");

module.exports = async function() {
  await simpleStorage.postMessage("Hi", {value: 100});
}
