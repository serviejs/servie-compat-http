import { Request, Response } from 'servie'
import { IncomingMessage, ServerResponse } from 'http'
import { PassThrough, Readable } from 'stream'

/**
 * Compatibility class for `http.IncomingMessage`.
 */
export class HttpRequest extends IncomingMessage {
  originalUrl: string // Express.js compat.
  complete = false
  httpVersion = '1.1'
  httpVersionMajor = '1'
  httpVersionMinor = '1'

  constructor (req: Request) {
    super({ readable: false } as any)

    this.url = req.url
    this.originalUrl = req.originalUrl
    this.method = req.method

    onreadable(req.stream(), this)

    this.destroy = () => req.abort()
  }

}

/**
 * Compatibility class for `http.ServerResponse`.
 */
export class HttpResponse extends ServerResponse {
  constructor (_req: IncomingMessage) {
    super(_req)
  }
}

/**
 * Forward the readable stream.
 *
 * Source: https://github.com/mafintosh/fwd-stream
 */
function onreadable (source: Readable, dest: Readable) {
  let reading = false

  const fwd = () => {
    let data: Buffer

    // tslint:disable-next-line
    while ((data = source.read()) !== null) {
      reading = false
      dest.push(data)
    }
  }

  source.on('readable', () => {
    if (reading) {
      fwd()
    }
  })

  source.on('end', () => {
    fwd()
    dest.push(null)
  })

  source.on('error', (err) => {
    dest.emit('error', err)
  })

  source.on('close', () => {
    fwd()

    process.nextTick(() => dest.emit('close'))
  })

  dest._read = () => {
    reading = true
    fwd()
  }
}

/**
 * Wrapper for HTTP applications (e.g. Express).
 */
export function createServer (
  handler: (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => void
) {
  return function (req: Request, next: () => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      const request = new HttpRequest(req)
      const response = new HttpResponse(request)
      const socket = new PassThrough()
      let ended = false

      response.write = (chunk?: any, encoding?: any, cb?: () => void) => {
        end()
        return socket.write(chunk, encoding, cb)
      }

      response.end = (chunk?: any, encoding?: any, cb?: () => void) => {
        end()
        return socket.end(chunk, encoding, cb)
      }

      response.assignSocket(socket)

      // Proxy the HTTP data back to the instances when ending HTTP-compat mode.
      function end (err?: Error, proceed?: boolean) {
        if (ended) return

        ended = true
        req.url = request.url
        req.method = request.method

        if (err) return reject(err)

        return resolve(proceed ? next() : new Response({
          status: response.statusCode,
          statusText: response.statusMessage,
          headers: (response as any)._headers,
          body: socket
        }))
      }

      handler(request, response, (err: Error) => end(err, true))
    })
  }
}
