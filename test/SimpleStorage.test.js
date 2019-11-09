const SimpleStorageContract = artifacts.require("./SimpleStorage.sol");

const INCORRECT_AMOUNT_OF_ETH = "The incorrect amount of ETH was sent";
const NO_ETH = "No ETH was sent";
const EMPTY_MESSAGE = "An empty message cannot be posted";
const INVALID_OP_CODE = "invalid opcode";

require('chai').use(require('chai-as-promised')).should();

contract("SimpleStorage", addresses => {
  let simpleStorage;
  const expirationDate = new Date(2019, 11, 7);

  beforeEach(async () => {
    simpleStorage = await SimpleStorageContract.new(expirationDate.getTime() / 1000);
  });

  it("has the correct expiration date", async () => {
    const storedExpirationDate = new Date(await simpleStorage.expiresAt() * 1000);
    assert.equal(storedExpirationDate.getTime(), expirationDate.getTime());
  });

  describe("getNumberOfMessages", async () => {
    it("starts with no messages", async () => {
      const numMessages = await simpleStorage.getNumberOfMessages();
      assert.equal(numMessages, 0);
    });
  });

  describe("postMessage", async () => {
    it("increments the number of messages", async () => {
      let numMessages = await simpleStorage.getNumberOfMessages();
      assert.equal(numMessages, 0);

      await simpleStorage.postMessage("Hi", {from: addresses[0], value: 100});

      numMessages = await simpleStorage.getNumberOfMessages();
      assert.equal(numMessages, 1);
    });

    it("stores the correct values", async () => {
      const author = addresses[4];
      const text = "Test for storage of correct values";
      const value = web3.utils.toWei("1.1523", "ether");

      await simpleStorage.postMessage(text, {from: author, value: value});
      
      let numMessages = await simpleStorage.getNumberOfMessages();
      assert.equal(numMessages, 1);

      const message = await simpleStorage.getMessage(0);
      assert.equal(message.text, text);
      assert.equal(message.author, author);
      assert.equal(message.value, value);
    });

    it("increments the author's balance", async () => {
      const value = 100;
      const author = addresses[0];
      
      let authorBalance = await simpleStorage.getAuthorBalance({from: author});
      assert.equal(authorBalance, 0);

      await simpleStorage.postMessage("Message 1", {from: author, value: value});
      
      authorBalance = await simpleStorage.getAuthorBalance({from: author});
      assert.equal(authorBalance, value);

      const nextValue = await simpleStorage.getNextValue();
      await simpleStorage.postMessage("Message 2", {from: author, value: nextValue});

      authorBalance = await simpleStorage.getAuthorBalance({from: author});
      assert.equal(authorBalance, value + nextValue.toNumber());
    });

    it("does not allow posting an empty message", async () => {
      simpleStorage.postMessage("", {from: addresses[0], value: 100}).should.be.rejectedWith(EMPTY_MESSAGE);
    });

    it("does not allow posting of messages 256 characters long or longer", async () => {
      simpleStorage.postMessage("", {from: addresses[0], value: 100}).should.be.rejectedWith(EMPTY_MESSAGE);
    });

    it("does not allow the initial message to have a value of 0", async () => {
      // Precondition - there are no messages
      assert.equal(await simpleStorage.getNumberOfMessages(), 0);

      simpleStorage.postMessage("Message 1", {from: addresses[0], value: 0}).should.be.rejectedWith(NO_ETH);
    });

    it("does not allow posting of subsequent messages without the correctly calculated value", async () => {
      await simpleStorage.postMessage("Hi", {from: addresses[0], value: 100});
      
      const nextValue = (await simpleStorage.getNextValue()).toNumber();
      assert.equal(nextValue, 107);

      simpleStorage.postMessage("Hi", {from: addresses[0], value: nextValue + 10}).should.be.rejectedWith(INCORRECT_AMOUNT_OF_ETH);
      simpleStorage.postMessage("Hi", {from: addresses[0], value: nextValue - 10}).should.be.rejectedWith(INCORRECT_AMOUNT_OF_ETH);
    });
  });

  describe("getMessage", async () => {
    it("returns the correct message content", async () => {
      let message;

      await simpleStorage.postMessage("The first message", {from: addresses[0], value: 60});

      message = await simpleStorage.getMessage(0);
      assert.equal(message.text, "The first message");
      assert.equal(message.author, addresses[0]);
      assert.equal(message.value.toNumber(), 60);

      const nextValue = await simpleStorage.getNextValue();
      await simpleStorage.postMessage("The second message", {from: addresses[1], value: nextValue});

      message = await simpleStorage.getMessage(1);
      assert.equal(message.text, "The second message");
      assert.equal(message.author, addresses[1]);
      assert.equal(message.value.toNumber(), nextValue);
    });

    it("throws when trying to access an invalid message index", async () => {
      // Precondition - there are no messages
      assert.equal(await simpleStorage.getNumberOfMessages(), 0);

      simpleStorage.getMessage(10).should.be.rejectedWith(INVALID_OP_CODE);
    });
  });
});