import { Request, Response, HeadersObject } from 'servie'
import { IncomingMessage, ServerResponse } from 'http'
import { PassThrough, Readable } from 'stream'

/**
 * Compatibility class for `http.IncomingMessage`.
 */
export class HttpRequest extends IncomingMessage {
  _req: Request
  socket: any

  complete = false
  httpVersion = '1.1'
  httpVersionMajor = '1'
  httpVersionMinor = '1'

  constructor (req: Request) {
    super({ readable: false } as any)

    this.url = req.url
    this.method = req.method

    onreadable(req.stream(), this)

    this.destroy = () => req.abort()
  }

}

/**
 * Compatibility class for `http.ServerResponse`.
 */
export class HttpResponse extends ServerResponse {
  constructor (_req: IncomingMessage, res: Response) {
    super(_req)

    this.addTrailers = (headers: HeadersObject) => res.trailers.object(headers)
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
  return function (req: Request, res: Response, next: () => Promise<void>) {
    return new Promise((resolve, reject) => {
      const request = new HttpRequest(req)
      const response = new HttpResponse(request, res)

      const socket = new PassThrough()

      // Proxy the response to the socket.
      response.write = socket.write.bind(socket)
      response.end = socket.end.bind(socket)
      response.assignSocket(socket)

      // End router when data is written.
      socket.on('readable', () => end())

      // Proxy the HTTP data back to the instances when ending HTTP-compat mode.
      function end (err?: Error, proceed?: boolean) {
        req.url = request.url
        req.method = request.method
        req.headers.object(request.headers)

        res.status = response.statusCode
        res.statusText = response.statusMessage
        res.headers.object((response as any)._headers)
        res.body = socket

        return err ? reject(err) : resolve(proceed ? next() : undefined)
      }

      handler(request, response, (err: Error) => end(err, true))
    })
  }
}
