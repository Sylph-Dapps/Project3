const SimpleStorageContract = artifacts.require("./SimpleStorage.sol");

const INCORRECT_AMOUNT_OF_ETH = "The incorrect amount of ETH was sent";

contract("SimpleStorage", addresses => {
  let simpleStorage;

  beforeEach(async () => {
    simpleStorage = await SimpleStorageContract.new();
  })

  it("starts with no messages", async () => {
    const numMessages = await simpleStorage.getNumberOfMessages();
    assert.equal(numMessages, 0);
  });

  it("posts a message", async () => {
    await simpleStorage.postMessage("Hi", {from: addresses[0], value: 100});
    let numMessages = await simpleStorage.getNumberOfMessages();
    assert.equal(numMessages, 1);

    const message = await simpleStorage.getMessage(0);
    assert.equal(message.text, "Hi");
    assert.equal(message.author, addresses[0]);
    assert.equal(message.value, 100);

    const nextValue = (await simpleStorage.getNextValue()).toNumber();
    assert.equal(nextValue, 107);

    await simpleStorage.postMessage("Hi", {from: addresses[0], value: nextValue});
    numMessages = await simpleStorage.getNumberOfMessages();
    assert.equal(numMessages, 2);

    simpleStorage.postMessage("Hi", {from: addresses[0], value: 5}).should.be.rejectedWith(INCORRECT_AMOUNT_OF_ETH);
  });
});