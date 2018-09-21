import Ganache from 'ganache-core'
import Web3 from 'web3'

import { bytecode, abi } from '../testdata/eventsContract.json'
import { parseLog } from './'

describe('parseLog', () => {
  let web3
  let address
  let receipt

  beforeAll(async () => {
    const provider = Ganache.provider({
      total_accounts: 4
    })

    const { accounts: accountsMap } = provider.manager.state

    const accounts = Object.keys(accountsMap)

    console.info(`Account: ${accounts[0]}`)

    web3 = new Web3(provider)

    const contract = new web3.eth.Contract(abi, null, {
      from: accounts[0],
      gas: 500000
    })

    const instance = await contract.deploy({ data: bytecode.object }).send()

    ;({ _address: address } = instance)

    console.info(`Contract: ${address}`)

    const tx = await new Promise(resolve => {
      instance.methods.emit().send().on('transactionHash', resolve)
    })

    console.info(`Tx: ${tx}`)

    receipt = await web3.eth.getTransactionReceipt(tx)
  })

  it('parses an individual event', async () => {
    const eventAbi = abi.find(({ name }) => name === 'Event1')

    const [ event ] = parseLog(receipt.logs, [ eventAbi ])

    expect(event.name).toEqual('Event1')
    expect(event.address).toEqual(address)
    expect(event.blockNumber).toEqual(await web3.eth.getBlockNumber())
    expect(event.args).toEqual({
      stringVar1: web3.utils.sha3('test1'), /* string type cannot be indexed, so is auto-hashed by evm */
      stringVar2: 'test2'
    })
  })

  it('can apply a contract address filter', () => {
    const eventAbi = abi.find(({ name }) => name === 'Event1')

    let results = parseLog(receipt.logs, [ eventAbi ], {
      address: `0xdaedbeef`
    })

    expect(results.length).toEqual(0)

    results = parseLog(receipt.logs, [ eventAbi ], {
      address
    })

    expect(results.length).toEqual(1)
  })

  it('can apply a block number filter', () => {
    const eventAbi = abi.find(({ name }) => name === 'Event1')

    let results = parseLog(receipt.logs, [ eventAbi ], {
      blockNumber: 12323
    })

    expect(results.length).toEqual(0)

    results = parseLog(receipt.logs, [ eventAbi ], {
      blockNumber: receipt.logs[0].blockNumber
    })

    expect(results.length).toEqual(1)
  })

  it('skips anonymous events', () => {
    const eventAbi = abi.find(({ name }) => name === 'Event4')

    const parsed = parseLog(receipt.logs, [ eventAbi ])

    expect(parsed.length).toEqual(0)
  })

  it('parses multiple events', () => {
    const eventAbis = abi.filter(({ name }) => name === 'Event1' || name === 'Event2')

    const [ event1, event2 ] = parseLog(receipt.logs, eventAbis)

    expect(event1.name).toEqual('Event1')
    expect(event2.name).toEqual('Event2')
    expect(event2.args).toEqual({
      bytes32Var: web3.utils.sha3('test1'),
      boolVar: false,
      stringVar: 'test2',
    })
  })

  it('parses events supplied as a contract abi', () => {
    const [ event1, event2, event3 ] = parseLog(receipt.logs, abi)

    expect(event1.name).toEqual('Event1')
    expect(event2.name).toEqual('Event2')

    expect(event3.name).toEqual('Event3')
    expect(event3.args).toMatchObject({
      addressVar: address,
      uintVar: '2342',
      uint64Var2: [ '100', '101', '102' ],
    })
    expect(event3.args.uint64Var1).toBeDefined()
  })
})
