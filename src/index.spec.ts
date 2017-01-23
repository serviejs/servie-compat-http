import { createServer } from './index'
import { Request, Response } from 'servie'
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

      const req = new Request({ url: '/' })

      return s(req, finalhandler(req)).then((res) => {
        expect(req.url).toEqual('/')
        expect(res.status).toEqual(302)

        return res.text().then((body) => expect(body).toEqual('write stream'))
      })
    })

    it('should work without any response body', () => {
      const s = createServer(function (_req, res) {
        res.end()
      })

      const req = new Request({ url: '/' })

      return s(req, finalhandler(req)).then((res) => {
        expect(req.url).toEqual('/')
        expect(res.status).toEqual(200)

        return res.text().then((body) => expect(body).toEqual(''))
      })
    })
  })

  describe('fallback', () => {
    it('should fallback to next route', () => {
      const app = createServer(function (_req, _res, next) {
        return next()
      })

      const req = new Request({ url: '/test' })

      return app(req, finalhandler(req))
        .then((res) => {
          expect(req.url).toEqual('/test')
          expect(res.status).toEqual(404)

          return res.text().then((body) => expect(body).toEqual('Cannot GET /test'))
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

      const req = new Request({ url: '/test', body: createReadStream(filename) })

      return s(req, finalhandler(req))
        .then((res) => {
          expect(req.url).toEqual('/test')
          expect(res.status).toEqual(200)

          return res.text().then((body) => expect(body).toEqual(contents))
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

      const req = new Request({ url: '/test?query=true' })

      return s(req, finalhandler(req))
        .then((res) => {
          expect(req.url).toEqual('/test?query=true')
          expect(res.status).toEqual(201)
          expect(res.headers.get('Content-Type')).toEqual('application/json; charset=utf-8')

          return res.text().then((body) => expect(JSON.parse(body)).toEqual({ query: 'true' }))
        })
    })
  })
})

function finalhandler (req: Request) {
  return function () {
    return Promise.resolve(new Response(req, {
      status: 404,
      body: `Cannot ${req.method} ${req.url}`
    }))
  }
}
