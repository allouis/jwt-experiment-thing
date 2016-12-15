const crypto = require('crypto')
const fs = require('fs')
const http = require('http')
const keypair = require('keypair')

module.exports = JWTManager

function JWTManager (options) {
  let keys
  try {
    keys = JSON.parse(fs.readFileSync(options.keyPath).toString())
  } catch (err) {
    keys = keypair()
    fs.writeFileSync(options.keyPath, JSON.stringify(keys))
  }

  this.private_key = keys.private
  this.public_key = keys.public

  this.header = Buffer.from(JSON.stringify({
    alg: 'RS256',
    typ: 'jwt'
  })).toString('base64')

  this.address = options.address

  this.trustedIssuers = options.trustedIssuers

  this.requestHandler = function (req, res) {
    res.end(this.public_key)
  }
}

JWTManager.prototype.createToken = function createToken (body) {
  const payload = Buffer.from(JSON.stringify(Object.assign({}, body, {
    iss: this.address
  }))).toString('base64')

  const signature = crypto.createSign('sha256')
    .update(this.header + '.' + payload)
    .sign(this.private_key, 'base64')

  return [this.header, payload, signature].join('.')
}

JWTManager.prototype.verifyToken = function verifyToken (token, cb) {
  const parts = token.split('.')

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

  const issuer = payload.iss

  if (issuer === this.address) {
    const verified = verify(parts, this.public_key)

    if (verified) return cb(null, true)
    return cb(new Error('invalid sig'))
  }

  if (this.trustedIssuers.indexOf(issuer) === -1) {
    return cb(new Error('non trusted issuer'))
  }

  http.get(issuer, function (res) {
    let publicKey = ''
    res.on('err', err => cb(err))
    res.on('data', data => {
      publicKey += data
    })
    res.on('end', function () {
      const verified = verify(parts, publicKey)

      if (verified) return cb(null, true)
      return cb(new Error('invalid sig'))
    })
  })
}

function verify (parts, publicKey) {
  return crypto.createVerify('sha256')
    .update(parts[0] + '.' + parts[1])
    .verify(publicKey, parts[2], 'base64')
}
