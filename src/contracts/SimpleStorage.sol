pragma solidity >=0.4.21 <0.6.0;

contract SimpleStorage {

  struct Message {
    address author;
    string text;
    uint value;
  }

  Message[] messages;
  address public owner;

  constructor() public {
    owner = msg.sender;
  }

  function getNumberOfMessages() public view returns (uint num)
  {
    return messages.length;
  }

  function getMessage(uint index)
    public
    view
    returns (
      address author,
      string memory text,
      uint value
    )
  {
    Message storage m = messages[index];
    return (
      m.author,
      m.text,
      m.value
    );
  }

  function postMessage(string memory _text) public payable
  {
    require(msg.value > 0, "No ETH was sent");
    if(messages.length > 0) {
      require(msg.value == getNextValue(), "The incorrect amount of ETH was sent");
    }

    Message memory m = Message({
      author: msg.sender,
      text: _text,
      value: msg.value
    });
    messages.push(m);
  }

  function getNextValue() public view returns (uint value)
  {
    uint currentValue = messages[messages.length - 1].value;
    return currentValue + (currentValue * 7 / 100);
  }

}