const port = process.argv[2]
const trustedIssuers = process.argv.slice(2)

const path = require('path')
const http = require('http')

const JWTManager = require('./')

const jwt = new JWTManager({
  keyPath: path.join(__dirname, `/${port}.keys`),
  address: `http://localhost:${port}`,
  trustedIssuers
})

const server = http.createServer()

server.on('request', function (req, res) {
  if (req.url === '/') {
    return jwt.requestHandler(req, res)
  }
  if (req.url === '/create') {
    return res.end(jwt.createToken({
      hello: 'world'
    }))
  }
  if (req.url === '/verify') {
    jwt.verifyToken(req.headers.token, function (err, cb) {
      if (err) {
        console.log(err)
        return res.end(err.message)
      }
      res.end('valid :)')
    })
  }
})

server.listen(port)
