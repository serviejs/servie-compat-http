import { createServer, HttpRequest, createBody } from './index'
import { finalhandler } from 'servie-finalhandler'
import { join } from 'path'
import { createReadStream, readFileSync } from 'fs'
import express = require('express')

describe('compat-http', () => {
  describe('writable', () => {
    it('should work like http', () => {
      const s = createServer(function (_req, res) {
        res.statusCode = 302
        res.write('write ')
        res.write('stream')
        res.end()
      })

      const req = new HttpRequest({ url: '/' })

      return s(req, finalhandler(req)).then((res) => {
        expect(req.url).toEqual('/')
        expect(res.statusCode).toEqual(302)

        return res.body.text().then((body) => expect(body).toEqual('write stream'))
      })
    })

    it('should work without any response body', () => {
      const s = createServer(function (_req, res) {
        res.end()
      })

      const req = new HttpRequest({ url: '/' })

      return s(req, finalhandler(req)).then((res) => {
        expect(req.url).toEqual('/')
        expect(res.statusCode).toEqual(200)

        return res.body.text().then((body) => expect(body).toEqual(''))
      })
    })
  })

  describe('fallback', () => {
    it('should fallback to next route', () => {
      const app = createServer(function (_req, _res, next) {
        return next()
      })

      const req = new HttpRequest({ url: '/test' })

      return app(req, finalhandler(req))
        .then((res) => {
          expect(req.url).toEqual('/test')
          expect(res.statusCode).toEqual(404)

          return res.body.text().then((body) => expect(body).toEqual('Cannot GET /test'))
        })
    })
  })

  describe('readable', () => {
    it('should expose the readable stream', () => {
      const filename = join(__dirname, '../LICENSE')
      const contents = readFileSync(filename, 'utf8')

      const s = createServer(function (req, res) {
        req.pipe(res)
      })

      const req = new HttpRequest({ url: '/test', body: createBody(createReadStream(filename)) })

      return s(req, finalhandler(req))
        .then((res) => {
          expect(req.url).toEqual('/test')
          expect(res.statusCode).toEqual(200)

          return res.body.text().then((body) => expect(body).toEqual(contents))
        })
    })
  })

  describe('express', () => {
    it('should work with express', () => {
      const app = express()

      app.get('/test', (req: express.Request, res: express.Response) => {
        res.status(201).json(req.query)
      })

      const s = createServer(app)

      const req = new HttpRequest({ url: '/test?query=true' })

      return s(req, finalhandler(req))
        .then((res) => {
          expect(req.url).toEqual('/test?query=true')
          expect(res.statusCode).toEqual(201)
          expect(res.headers.get('Content-Type')).toEqual('application/json; charset=utf-8')

          return res.body.text().then((body) => expect(JSON.parse(body)).toEqual({ query: 'true' }))
        })
    })
  })
})
