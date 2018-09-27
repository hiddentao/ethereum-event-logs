const Abi = require('web3-eth-abi')

const indexedAsHash = type => !(
  (type.startsWith('uint')
  || type.startsWith('int')
  || type.startsWith('byte')
  || type.startsWith('bool')
  || type.startsWith('address')) && (!type.includes('['))
)

const decodeParameters = (names, types, data) => {
  const ret = {}

  if (names.length && names.length === types.length) {
    const result = Abi.decodeParameters(types, data)

    for (let i = 0; types.length > i; i += 1) {
      if (undefined !== result[i]) {
        ret[names[i]] = result[i]
      }
    }
  }

  return ret
}

const createArgsParser = input => {
  const indexedNames = []
  const indexedTypes = []

  const nonIndexedNames = []
  const nonIndexedTypes = []

  input.forEach(({ indexed, name, type }) => {
    if (indexed) {
      indexedNames.push(name)

      // dynamically-sized values do not get stored as-is, they are SHA3'd prior
      // to being indexed
      if (indexedAsHash(type)) {
        indexedTypes.push('bytes32')
      } else {
        indexedTypes.push(type)
      }
    } else {
      nonIndexedNames.push(name)
      nonIndexedTypes.push(type)
    }
  })

  return ({ topics, data }) => {
    // trim "0x.." from the front
    const indexedData = topics.slice(1).map(str => str.slice(2)).join('')
    const nonIndexedData = data.slice(2)

    const args = {}

    Object.assign(args, decodeParameters(indexedNames, indexedTypes, indexedData))
    Object.assign(args, decodeParameters(nonIndexedNames, nonIndexedTypes, nonIndexedData))

    return args
  }
}

const cachedParsers = new WeakMap()

export const parseLog = (logs, eventAbis, filter = {}) => {
  const filteredAbis = eventAbis.filter(({ anonymous }) => !anonymous)

  const parsers = filteredAbis.map(thisAbi => {
    const key = JSON.stringify(thisAbi)

    if (!cachedParsers[key]) {
      const { name, inputs } = thisAbi

      // compute event signature hash
      const sig = Abi.encodeEventSignature(
        `${name}(${inputs.map(({ type }) => type).join(',')})`
      )

      cachedParsers[key] = {
        name,
        sig,
        parseArgs: createArgsParser(inputs)
      }
    }

    return cachedParsers[key]
  })

  let filteredLogs = logs

  if (Object.keys(filter).length) {
    filteredLogs = logs.filter(({ address, blockNumber }) => (
      (undefined === filter.address || address.toLowerCase() === filter.address.toLowerCase())
        && (undefined === filter.blockNumber || blockNumber === filter.blockNumber)
    ))
  }

  return parsers.reduce((retSoFar, { name, sig, parseArgs }) => {
    const matches = filteredLogs.reduce((soFar, log) => {
      if (log.topics[0] === sig) {
        soFar.push({
          name,
          address: log.address,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          transactionHash: log.transactionHash,
          args: parseArgs(log),
          log
        })
      }
      return soFar
    }, [])

    retSoFar.push(...matches)

    return retSoFar
  }, [])
}
