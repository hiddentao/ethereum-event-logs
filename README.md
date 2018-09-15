# ethereum-event-logs

[![Build Status](https://api.travis-ci.org/hiddentao/ethereum-event-logs.svg?branch=master)](https://travis-ci.org/hiddentao/ethereum-event-logs)
[![Coverage Status](https://coveralls.io/repos/github/hiddentao/ethereum-event-logs/badge.svg?branch=master)](https://coveralls.io/github/hiddentao/ethereum-event-logs?branch=master)

Parse Ethereum event logs with ease! 🎡

Features:
* Can parse logs for multiple event ABIs at the same time
* Accurately decodes event parameter values (both indexed and non-indexed)
* Automatically decodes non-indexable values as `bytes32` ([read more](https://ethereum.stackexchange.com/a/7170))
* Not tied to on any particular web3 library, can be used independently

## Install

* NPM/Yarn: `ethereum-event-logs`

## Example usage

Imagine the following contract:

```solidity
pragma solidity ^0.4.24;

contract Events {
    event Event1(string indexed stringVar1, string stringVar2);
    event Event2(bytes32 indexed bytes32Var, bool indexed boolVar, string stringVar);
    event Event3(address indexed addressVar, uint uintVar, uint64[] indexed uint64Var1, uint64[] uint64Var2);
    event Event4(bytes bytesVar) anonymous;

    constructor () public {}

    function emit() public {
        emit Event1('test1', 'test2');
        emit Event2(keccak256('test1'), false, 'test2');
        uint64[] memory numbers = new uint64[](3);
        numbers[0] = 100;
        numbers[1] = 101;
        numbers[2] = 102;
        emit Event3(address(this), 2342, numbers, numbers);
        emit Event4('0x123');
    }
}
```

Let's say we deploy it and call `emit()` via an on-chain transaction. The
receipt for this transaction will contain the event logs.

Here is how we can parse the logs using this library:

```js
// import the parser
const { parseLogs } = require('ethereum-event-logs')
const { abi } = require('./ExampleContract.json')

const receipt = /* execute tx on chain and wait for receipt */

// we can parse all events in the contract by passing through the ABI:
const events = parseLog(receipt.logs, abi)

console.log(events)
/*
[
  {
    name: 'Event1',
    args: {
      stringVar1: '0x...', /* === web3.utils.sha3('test1') */
      stringVar2: 'test2'
    },
    log: {
      ... /* the log object which represents this event */
    }
  },
  {
    name: 'Event2',
    args: {
      bytes32Var: '0x...', /* === web3.utils.sha3('test1') */
      boolVar: false,
      stringVar: 'test2'
    },
    log: {
      ... /* the log object which represents this event */
    }
  },
  {
    name: 'Event3',
    args: {
      addressVar: '0x...' /* address of contract */,
      uintVar: '2342',
      uint64Var1: '0x...',
      uint64Var2: [ '100', '101', '102' ],
    },
    log: {
      ... /* the log object which represents this event */
    }
  }
  /* Event4 is defined as anonymous, hence it doesn't get parsed */
]
 */
```

_Notice above that `Event1.stringVar1` is returned as a SHA3 hash instead of the
actual string. This is because only finite-sized scalar types (i.e. that fit within
  64 bytes) can be `indexed` as an event argument. All other types have their
  values hashed prior to indexing._

To only search for an individual event just pass that event's ABI on its own:

```js
const eventAbi = abi.find(({ name }) => name === 'Event1')

const events = parseLog(receipt.log, [ eventAbi ])
```

You can filter by contract address:

```js
const events = parseLog(receipt.log, [ eventAbi ], {
  address: '0x....'
})
```

You can also filter by block number:

```js
const events = parseLog(receipt.log, [ eventAbi ], {
  blockNumber: 1234...
})
```

## Dev guide

* Install deps: `yarn`
* Tests: `yarn test`
* Tests with coverage: `yarn test:coverage`
* Build final lib: `yarn build`
* Lint: `yarn lint`

## License

MIT

**Note: `string` type values cannot be `indexed` as well due to topic byte size limitations ([read more](https://ethereum.stackexchange.com/a/7170))**
