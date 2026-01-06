import { Observable, OperatorFunction, Subject, Subscription } from 'rxjs'

/**
 * branch 操作符
 * @param fn 回调函数，接收共享流 Observable，返回一个或多个分流 Observable
 */
export function branch<T>(
    fn: (shared$: Observable<T>) => Observable<any> | Observable<any>[]
): OperatorFunction<T, T> {
    return (source$: Observable<T>) =>
        new Observable<T>(subscriber => {
            const shared$ = new Subject<T>()
            const subscriptions: Subscription[] = []

            // 启动分流逻辑(将主题交给分流)
            const baranchOrBranchArray = fn(shared$)
            const branchs = Array.isArray(baranchOrBranchArray)
                ? baranchOrBranchArray
                : [baranchOrBranchArray]

            // 处理一下分流上的错误，让他别影响主流程
            branchs.forEach(branch =>
                subscriptions.push(
                    branch.subscribe({
                        error: err =>
                            // eslint-disable-next-line no-console
                            console.error('branch side-stream error:', err),
                    })
                )
            )

            // 将原始流广播给分裂和主流后面的操作符
            const mainSubscription = source$.subscribe({
                next: value => {
                    shared$.next(value) // 广播给分流
                    subscriber.next(value) // 主流输出
                },
                error: err => {
                    shared$.error(err)
                    subscriber.error(err)
                },
                complete: () => {
                    shared$.complete()
                    subscriber.complete()
                },
            })

            subscriptions.push(mainSubscription)

            return () => subscriptions.forEach(sub => sub.unsubscribe())
        })
}
