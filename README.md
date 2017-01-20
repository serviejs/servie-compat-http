# Servie Compat HTTP

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Map Servie `Request` and `Response` instances to node.js HTTP compatible objects.

## Installation

```
npm install servie-compat-http --save
```

## Usage

```ts
import { createServer } from 'servie-compat-http'

export const server = createServer(function (req, res, next) {
  res.write('hello world')
  res.end()
})
```

## Additional Resources

* [`router`](https://github.com/pillarjs/router) Express.js-like router for HTTP
* [`compose-middleware`](https://github.com/blakeembrey/compose-middleware) Compose an array of HTTP middleware into a single function
* [`connect`](https://github.com/senchalabs/connect) Simple middleware framework
* [`express`](https://github.com/expressjs/express) Minimal web framework for node

## TypeScript

This project is written using [TypeScript](https://github.com/Microsoft/TypeScript) and publishes the definitions directly to NPM.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/servie-compat-http.svg?style=flat
[npm-url]: https://npmjs.org/package/servie-compat-http
[downloads-image]: https://img.shields.io/npm/dm/servie-compat-http.svg?style=flat
[downloads-url]: https://npmjs.org/package/servie-compat-http
[travis-image]: https://img.shields.io/travis/blakeembrey/node-servie-compat-http.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/node-servie-compat-http
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/node-servie-compat-http.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/node-servie-compat-http?branch=master
