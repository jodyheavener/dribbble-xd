require('../vendor/base64')
const serialize = require('../vendor/serialize')
const Settings = require('./settings')
const config = require('./config')
const uxp = require('uxp')
const app = require('application')

/**
 * Check against our internal dimension requirements
 * to see if the selection dimensions are too small
 */
const nodeTooSmall = function(node) {
  return (
    node.width < config.dimensionReqs.width &&
    node.height < config.dimensionReqs.height
  )
}

/**
 * Check against our internal list of Node types
 * to ensure we can export the node correctly
 */
const nodeNotAllowed = function(node) {
  return config.allowedNodeTypes.indexOf(node.constructor.name) < 0
}

/**
 * Convert an array of strings in to a sentence
 */
const toSentence = function(array, lastSeparator='or') {
  return array.reduce((prev, curr, i) => {
    return prev + curr + ((i===array.length-2) ? `, ${lastSeparator} ` : ', ')
  }, '').slice(0, -2)
}

/**
 * Generate a random string
 */
const randomString = function() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Pick a random element from an array
 */
const pickRandom = function(array) {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Using the XD Plugin API, save a selection node
 * to the local filesystem temporarily, then open
 * and read it, and finally convert it to a base64
 * string and resolve the promise with it
 */
const imageBase64FromNode = async function(node) {
  const tempFolder = await uxp.storage.localFileSystem.getTemporaryFolder()
  const shotFile = await tempFolder.createEntry(`${randomString()}.png`, {
    overwrite: true
  })

  return new Promise(function(resolve, reject) {
    app.createRenditions([{
      node: node,
      outputFile: shotFile,
      type: app.RenditionType.PNG,
      scale: 2
    }]).then(async function(files) {
      const buffer = await files[0].read({
        format: uxp.storage.formats.binary
      })

      let binaryData = ''
      let bytes = new Uint8Array(buffer)
      let byteLength = bytes.byteLength

      for (var i = 0; i < byteLength; i++) {
        binaryData += String.fromCharCode(bytes[i])
      }

      resolve(window.btoa(binaryData))
    }).catch(function(error) {
      reject(error)
    })
  })
}

/**
 * XHR helper to poll an address, with max timeout and retries,
 * until a succesful response is returned
 */
const pollRequest = function({ method, url, params='', timeout=3000, max=10 }={}) {
  let retryCount = 0

  const request = new XMLHttpRequest()
  const serializedParams = serializeObject(params)

  const performRequest = function() {
    retryCount = retryCount + 1
    request.send(serializedParams)
  }

  request.timeout = timeout
  // Y u no work?
  // request.responseType = 'json'

  request.open(method, url, true)
  request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')

  if (STAGING_AUTH != null) {
    request.setRequestHeader('Authorization', `Basic ${btoa(STAGING_AUTH)}`)
  }

  return new Promise((resolve, reject) => {
    request.addEventListener('load', () => {
      if (request.status === 200) {
        try {
          resolve(request)
        } catch (error) {
          reject({ state: 'error', error: `Couldn't parse response. ${error.message}, ${error.response}`})
        }
      } else {
        reject({ state: 'error', error: `Response code ${request.status}`})
      }
    })

    request.addEventListener('timeout', () => {
      if (retryCount === max) {
        return reject({ state: 'quit' })
      }

      performRequest()
    })

    request.addEventListener('error', (error) => {
      reject({ state: 'error', error: error })
    })

    performRequest()
  })
}

/**
 * Serialize an object (one level deep) in to URL params
 */
const serializeObject = function(obj) {
  return Object.keys(obj).map((key) => {
    return `${key}=${encodeURIComponent(obj[key])}`
  }).join('&')
}

/**
 * Set up out Settings module
 */
const settings = new Settings()

module.exports = {
  serialize,
  config,
  nodeTooSmall,
  nodeNotAllowed,
  toSentence,
  randomString,
  pickRandom,
  imageBase64FromNode,
  pollRequest,
  serializeObject,
  settings
}
