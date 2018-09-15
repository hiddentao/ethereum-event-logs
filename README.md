# ethereum-event-logs

Parse Ethereum event logs with ease.

Features:
* Can parse logs for multiple event ABIs at the same time
* Accurately decodes event parameter values (both indexed and non-indexed)
* Automatically decodes non-indexable values as `bytes32` ([read more](https://ethereum.stackexchange.com/a/7170))
* Not tied to on any particular web3 library, can be used independently

## Install

* NPM/Yarn: `ethereum-event-logs`

## Example usage



## Dev guide

* Install deps: `yarn`
* Tests: `yarn test`
* Tests with coverage: `yarn test:coverage`
* Build final lib: `yarn build`
* Lint: `yarn lint`

## License

MIT

**Note: `string` type values cannot be `indexed` as well due to topic byte size limitations ([read more](https://ethereum.stackexchange.com/a/7170))**
