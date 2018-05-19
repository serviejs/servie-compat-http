import { Response, createHeaders } from 'servie'
import { HttpRequest } from 'servie-http'
import { createBody } from 'servie/dist/body/node'
import { IncomingMessage, ServerResponse } from 'http'
import { PassThrough, Readable } from 'stream'

export { HttpRequest, createBody }

/**
 * Compatibility class for `http.IncomingMessage`.
 */
export class IncomingMessageCompat extends IncomingMessage {
  complete = false
  httpVersion = '1.1'
  httpVersionMajor = 1
  httpVersionMinor = 1

  constructor (req: HttpRequest) {
    super({ readable: false } as any)

    this.url = req.url
    this.method = req.method

    onreadable(req.body.stream(), this)

    this.destroy = () => req.abort()
  }

}

/**
 * Compatibility class for `http.ServerResponse`.
 */
export class ServerResponseCompat extends ServerResponse {
  constructor (req: IncomingMessage) {
    super(req)
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
  return function (req: HttpRequest, next: () => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      const request = new IncomingMessageCompat(req)
      const response = new ServerResponseCompat(request)
      const socket = new PassThrough()

      response.write = socket.write.bind(socket)
      response.end = socket.end.bind(socket)
      response.on = socket.on.bind(socket)
      response.once = socket.once.bind(socket)

      response.assignSocket(socket as any)
      socket.on('readable', () => end())

      // Proxy the HTTP data back to the instances when ending HTTP-compat mode.
      function end (err?: Error, proceed?: boolean) {
        req.url = request.url || '/'
        req.method = request.method || 'GET'

        if (err) return reject(err)

        return resolve(proceed ? next() : new Response({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          headers: createHeaders((response as any)._headers),
          body: createBody(socket)
        }))
      }

      handler(request, response, (err?: Error) => end(err, true))
    })
  }
}
