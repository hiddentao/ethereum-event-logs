const Abi = require('web3-eth-abi')

const decodeParameters = (names, types, data) => {
  const ret = {}

  if (names.length && names.length === types.length) {
    const result = Abi.decodeParameters(types, data)

    for (let i = 0; types.length > i; i += 1) {
      if (result[i]) {
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
      indexedTypes.push(type)
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

export const parseLog = (logs, abi, filter = {}) => {
  // allow for multiple
  if (!Array.isArray(abi)) {
    abi = [ abi ]
  }

  // now let's expand them out
  const eventAbis = abi.reduce((soFar, thisAbi) => {
    // event abi?
    if (thisAbi.type === 'event' && !thisAbi.anonymous) {
      soFar.push(thisAbi)
    }
    // contract abi
    else {
      soFar.push(...thisAbi.filter(item => item.type === 'event' && !item.anonymous))
    }

    return soFar
  }, [])

  const parsers = eventAbis.map(thisAbi => {
    if (cachedParsers[thisAbi]) {
      return thisAbi
    }

    const { name, inputs } = thisAbi

    // compute event signature hash
    const sig = Abi.encodeEventSignature(
      `${name}(${inputs.map(({ type }) => type).join(',')})`
    )

    // create an argument parser
    const parseArgs = createArgsParser(inputs)

    cachedParsers[thisAbi] = { name, sig, parseArgs }

    return cachedParsers[thisAbi]
  })

  const filteredLogs = (filter.address) ? (
    logs.filter(({ address }) => address === filter.address)
  ) : logs

  return filteredLogs.reduce((retSoFar, log) => {
    const matches = parsers.reduce((soFar, { name, sig, parseArgs }) => {
      if (log.topics[0] === sig) {
        soFar.push({
          name,
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
