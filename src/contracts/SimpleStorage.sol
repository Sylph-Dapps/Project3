pragma solidity >=0.4.21 <0.6.0;

contract SimpleStorage {

  struct Message {
    address author;
    string text;
    uint value;
  }

  Message[] messages;

  address public owner;

  mapping(address => uint) public authorBalances;

  uint256 public expiresAt;

  constructor(uint256 _expiresAt) public {
    owner = msg.sender;
    expiresAt = _expiresAt;
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
    require(bytes(_text).length > 0, "An empty message cannot be posted");
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

    authorBalances[msg.sender] += msg.value;
  }

  function getNextValue() public view returns (uint value)
  {
    uint currentValue = messages[messages.length - 1].value;
    return currentValue + (currentValue * 7 / 100);
  }

  function getAuthorBalance() public view returns(uint num)
  {
    return authorBalances[msg.sender];
  }

  function withdraw() public
  {
    require(now > expiresAt, "You cannot withdraw until after the expiration timestamp"); // solium-disable-line security/no-block-members
    uint amount = authorBalances[msg.sender];
    authorBalances[msg.sender] = 0;
    msg.sender.transfer(amount);
  }
}