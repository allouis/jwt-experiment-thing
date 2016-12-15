### usage

```javascript
const JWT = require('./')

const jwt = new JWT({
  keyPath: 'path/to/keys', // it creates the keys and writes to disk if they don't exist
  trustedIssuers: ['url', 'url2'], // list of trusted issuers, urls, should return public key with GET '/'
  address: 'url' // the address this JWT issuer hosts its public key
})

jwt.createToken({
  some: 'data'
}) // returns a token, object is set as the payload

jwt.verifyToken('some token', cb) // verifys the token against itself and all trusted issuers, cb(err, valid)

jwt.requestHandler // helper function, pass it (req, res) it responds with public key
```

### example

in three tabs

```
node example.js 5001 http://localhost:5002
node example.js 5002 http://localhost:5001 http://localhost:5003
node example.js 5003 http://localhost:5002
```

get a token from first server
token payload is just {hello: 'world'}

```
curl http://localhost:5001/create
```

first two should verify
last should not
```
curl -H "token:<token>" http://localhost:5001/verify
curl -H "token:<token>" http://localhost:5002/verify
curl -H "token:<token>" http://localhost:5003/verify
```
