import { from, Observable } from 'rxjs'
import { Readable } from 'stream'

/**
 * 将 Node.js Stream 转换为 RxJS Observable
 * @param stream Node.js Stream
 * @returns RxJS Observable
 * @example
 * ```ts
 * const stream = new Readable()
 * stream.push('hello')
 * stream.push('world')
 * stream.push(null)
 * const observable = StreamToObservable(stream)
 * observable.subscribe(data => console.log(data))
 * ```
 * @see https://rxjs.dev/api/index/function/fromEvent
 */
export function StreamToObservable(stream: Readable): Observable<any> {
  return new Observable(subscriber => {
    stream.on('data', data => subscriber.next(data))
    stream.on('error', err => subscriber.error(err))
    stream.on('end', () => subscriber.complete())

    return () => stream.destroy() // 断开 SSE 时自动清理
  })
}

/**
 * 将 AsyncIterable 转换为 RxJS Observable
 * @param iterator AsyncIterable
 * @returns RxJS Observable
 * @example
 * ```ts
 * const iterator = async function* () {
 *   yield 'hello'
 *   yield 'world'
 * }
 * const observable = AsyncIteratorToObservable(iterator)
 * observable.subscribe(data => console.log(data))
 * ```
 * @see https://rxjs.dev/api/index/function/fromEvent
 */
export function AsyncIteratorToObservable<T>(
  iterator: AsyncIterable<T>
): Observable<T> {
  return from(iterator)
}

/**
 * 将 Web Stream 转换为 RxJS Observable
 * @param webStream Web Stream
 * @returns RxJS Observable
 * @example
 * ```ts
 * const webStream = new ReadableStream()
 * webStream.push('hello')
 * webStream.push('world')
 * webStream.push(null)
 * const observable = ReadableStreamToObservable(webStream)
 * observable.subscribe(data => console.log(data))
 * ```
 * @see https://rxjs.dev/api/index/function/fromEvent
 */
export function ReadableStreamToObservable<T>(
  webStream: ReadableStream<T>
): Observable<T> {
  const reader = webStream.getReader()

  return new Observable<T>(subscriber => {
    async function read() {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          subscriber.next(value)
        }
        subscriber.complete()
      } catch (e) {
        subscriber.error(e)
      }
    }
    read()

    return () => reader.cancel()
  })
}
