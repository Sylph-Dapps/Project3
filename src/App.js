import React from 'react';
import SimpleStorageAbi from 'abis/SimpleStorage.json'
import getWeb3 from 'utils/getWeb3'

import './App.scss';

let web3;

const DistractionType = {
  NONE: "none",
  LOADING: "loading",
  AWAITING_SIGNATURE: "awaitingSignature",
};

const truncate = (input, maxLength) => input.length > maxLength ? `${input.substring(0, maxLength)}...` : input;

class App extends React.Component {

  constructor(props) {
    super(props);
    this.simpleStorage = null;
    this.state = {
      numMessages: null,
      message: null,
      nextValue: null,
      address: null,
      distraction: DistractionType.LOADING,
      messages: [],
      loadingOldMessages: false,
      showOldMessages: false,
    };

    this.input = React.createRef();
  }

  componentDidMount() {
    this.connectWeb3();
  }

  connectWeb3 = async () => {
    try {
      web3 = await getWeb3();
      if(window.ethereum && window.ethereum.on) {
        window.ethereum.on('accountsChanged', accounts => {
          this.setState({
            address: accounts[0]
          });
        });
      }

      const accounts = await web3.eth.getAccounts();
      this.setState({
        address: accounts[1]
      });

    } catch (error) {
      alert("Failed to load web3 or accounts. Check console for details.");
      console.log(error);
    }

    this.initializeContract();
  };

  initializeContract = async () => {
    const TruffleContract = require("@truffle/contract");
    const simpleStorageContract = TruffleContract(SimpleStorageAbi);
    simpleStorageContract.setProvider(web3.currentProvider);
    this.simpleStorage = await simpleStorageContract.deployed();
    this.loadContractData();
  };

  loadContractData = async () => {
    const numMessages = (await this.simpleStorage.getNumberOfMessages()).toNumber();

    let nextValue = web3.utils.toWei("1", "ether");
    if(numMessages > 0) {
      nextValue = (await this.simpleStorage.getNextValue());
    }

    let message = {
      author: "",
      text: "",
      value: "0",
    };
    
    if(numMessages > 0) {
      const result = (await this.simpleStorage.getMessage(numMessages - 1));
      message = {
        author: result.author,
        text: result.text,
        value: result.value
      };
    }

    this.setState({
      numMessages,
      nextValue,
      message,
      distraction: DistractionType.NONE,
    });

    if(this.state.showOldMessages) {
      this.loadOldMessages();
    }
  };

  postMessage = async () => {
    const {
      address,
    } = this.state;
    
    const text = this.input.current.value;
    if(!text) {
      console.log("Enter some text");
      return;
    }

    this.setState({
      distraction: DistractionType.AWAITING_SIGNATURE,
    });

    const receipt = await this.simpleStorage.postMessage(text, {from: address, value: this.state.nextValue});
    console.log(receipt);

    this.setState({
      distraction: DistractionType.LOADING,
    });

    this.loadContractData();
  };

  loadOldMessages = async () => {
    this.setState({
      loadingOldMessages: true,
    })

    const numMessages = (await this.simpleStorage.getNumberOfMessages()).toNumber();
    
    const messages = [];
    for(var a = 0; a < numMessages; a++) {
      const result = (await this.simpleStorage.getMessage(a));
      const message = {
        author: result.author,
        text: result.text,
        value: result.value
      };
      messages.push(message);
    }

    this.setState({
      numMessages,
      messages,
      loadingOldMessages: false,
    });
  };

  toggleOldMessages = async () => {
    const showOldMessages = !this.state.showOldMessages;

    if(showOldMessages) {
      this.loadOldMessages();
    }

    this.setState({
      showOldMessages,
    });
  }

  renderMessageInput() {
    return (
      <form onSubmit={e => {
        e.preventDefault();
        this.postMessage();
      }}>
        <div className="message-input">
          <input ref={this.input} />
          <button onClick={this.postMessage}>POST!</button>
        </div>
      </form>
    );
  }

  renderOldMessages() {
    const {
      numMessages,
      messages,
      loadingOldMessages,
      showOldMessages,
    } = this.state;

    if(numMessages < 2) {
      return null;
    }

    const messagesToRender = messages.length === 0 ? [] : messages.slice().reverse().slice(1);

    return (
      <div className="old-messages">
        { !loadingOldMessages &&
          <p>
            <button className="link-button"
              onClick={this.toggleOldMessages}>{showOldMessages ? 'Hide old messages' : 'Show old messages'}
            </button>
          </p>
        }
        { loadingOldMessages && <p>Loading...</p> }
        { showOldMessages &&
          <div className="entries">
            { !loadingOldMessages && messagesToRender.map((message, i) => (
              <div className="entry" key={i}>
                <div className="author hex">{truncate(message.author, 8)}</div>
                <div className="text">{message.text}</div>
                <div className="value hex">{parseFloat(web3.utils.fromWei(message.value)).toFixed(5)} ETH</div>
              </div>
            )) }
          </div>
        }
      </div>
    )
  }

  render() {
    const {
      address,
      numMessages,
      message,
      nextValue,
      distraction,
    } = this.state;

    let distractionMessage = null;
    if(distraction === DistractionType.AWAITING_SIGNATURE) {
      distractionMessage = "Sign that transaction!";
    } else if(distraction === DistractionType.LOADING) {
      distractionMessage = "Loading...";
    }

    return (
      <div className="App">
        <header>
          <h1>P R O J E C T 3</h1>
          <h2>Lock up some ETH to make a statement</h2>
          <p>By <a href="https://michaelvandaniker.com">Michael VanDaniker</a></p>
        </header>
        <div className="content">
          { distractionMessage &&
            <div className="distractor">{distractionMessage}</div>
          }
          { !distractionMessage &&
            <React.Fragment>
              { numMessages === 0 &&
                <React.Fragment>
                  <div>Be the first to lock up some ETH and make a statement</div>
                  { this.renderMessageInput() }
                </React.Fragment>
              }
              { numMessages > 0 &&
                <React.Fragment>
                  <Billboard visitorAddress={address}
                    message={message}
                    nextValue={nextValue}/>
                  
                  <p><button className="link-button">Learn more</button></p>

                  { this.renderMessageInput() }

                  <p style={{maxWidth: '600px', margin: '20px auto'}}>
                    On December 24, 2019 at 12:00 AM UTC it will no longer be possible to post new messages, thus immortalizing the most recently posted message!
                  </p>

                  { this.renderOldMessages() }
                  
                </React.Fragment>
              }
            </React.Fragment>
          }
        </div>
      </div>
    );
  }

}

function Billboard({visitorAddress, message, nextValue}) {
  let authorshipText = "";
  let pitch = "";
  if(visitorAddress.toLowerCase() === message.author.toLowerCase()) {
    authorshipText = (
      <span>You</span>
    );
    pitch = "you can post a new message in its place.";
  } else {
    authorshipText = (
      <span>The owner of <span className="includes-hex hex">{message.author}</span></span>
    )
    pitch = "you can have your message show up here instead.";
  }

  return (
    <div className="Billboard">
      <p>
        {authorshipText} locked up {web3.utils.fromWei(message.value)} ETH to display this message here:
      </p>
      <div className="text">{message.text}</div>
      <p>
        For 7% more ({web3.utils.fromWei(nextValue)} ETH) {pitch}
      </p>
    </div>
  );
}

export default App;
