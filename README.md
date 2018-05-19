# Servie Compat HTTP

[![NPM version](https://img.shields.io/npm/v/servie-compat-http.svg?style=flat)](https://npmjs.org/package/servie-compat-http)
[![NPM downloads](https://img.shields.io/npm/dm/servie-compat-http.svg?style=flat)](https://npmjs.org/package/servie-compat-http)
[![Build status](https://img.shields.io/travis/serviejs/servie-compat-http.svg?style=flat)](https://travis-ci.org/serviejs/servie-compat-http)
[![Test coverage](https://img.shields.io/coveralls/serviejs/servie-compat-http.svg?style=flat)](https://coveralls.io/r/serviejs/servie-compat-http?branch=master)

> Map Servie `Request` and `Response` instances to node.js HTTP objects.

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

Apache 2.0
