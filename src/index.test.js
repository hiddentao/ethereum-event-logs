import Ganache from 'ganache-core'
import keccak from 'keccak'
import Web3 from 'web3'

import { bytecode, abi } from '../testdata/eventsContract.json'
import { parseLog } from './'

describe('parseLog', () => {
  let receipt

  beforeAll(async () => {
    const provider = Ganache.provider({
      total_accounts: 4
    })

    const { accounts: accountsMap } = provider.manager.state

    const accounts = Object.keys(accountsMap)

    console.info(`Account: ${accounts[0]}`)

    const web3 = new Web3(provider)

    const contract = new web3.eth.Contract(abi, null, {
      from: accounts[0],
      gas: 500000
    })

    const instance = await contract.deploy({ data: bytecode }).send()

    console.info(`Contract: ${instance._address}`)

    const tx = await new Promise(resolve => {
      instance.methods.emit().send().on('transactionHash', resolve)
    })

    console.info(`Tx: ${tx}`)

    receipt = await web3.eth.getTransactionReceipt(tx)
  })

  it('parses an individual event', () => {
    const eventAbi = abi.find(({ name }) => name === 'Event1')

    const [ event ] = parseLog(receipt.logs, eventAbi)

    expect(event.name).toEqual('Event1')
    expect(event.args).toEqual({
      stringVar1: 'test1',
      stringVar2: 'test2'
    })
  })

  it('parses multiple events', () => {
    const eventAbis = abi.filter(({ name }) => name === 'Event1' || name === 'Event2')

    const [ event1, event2 ] = parseLog(receipt.logs, eventAbis)

    expect(event1.name).toEqual('Event1')
    expect(event1.args).toEqual({
      stringVar1: 'test1',
      stringVar2: 'test2'
    })

    expect(event2.name).toEqual('Event2')
    expect(event2.args).toEqual({
      bytes32Var: keccak('test1'),
      boolVar: false,
      stringVar: 'test2',
    })
  })
})
