import { createApp } from './app'

// const meta = app.$meta()
// This exported function will be called by `bundleRenderer`.
// This is where we perform data-prefetching to determine the
// state of our application before actually rendering it.
// Since data fetching is async, this function is expected to
// return a Promise that resolves to the app instance.
export default context => {
    const s = Date.now()
    const { app, router, store, preFetchComponent } = createApp()

    return new Promise((resolve, reject) => {
        // set router's location
        router.push(context.url)
        // context.meta = meta
        // wait until router has resolved possible async hooks
        router.onReady(() => {
            const matchedComponents = router.getMatchedComponents()
            // no matched routes
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            }
            // Call preFetch hooks on components matched by the route.
            // A preFetch hook dispatches a store action and returns a Promise,
            // which is resolved when the action is complete and store state has been
            // updated.
            Promise.all(preFetchComponent.concat(matchedComponents).map(({ asyncData }) => asyncData && asyncData({
                store,
                route: router.currentRoute,
                isServer: true,
                isClient: false
            }))).then(() => {
                console.log(`data pre-fetch: ${Date.now() - s}ms`)

                // After all preFetch hooks are resolved, our store is now
                // filled with the state needed to render the app.
                // Expose the state on the render context, and let the request handler
                // inline the state in the HTML response. This allows the client-side
                // store to pick-up the server-side state without having to duplicate
                // the initial data fetching on the client.
                context.state = store.state
                context.isProd = process.env.NODE_ENV === 'production'
                resolve(app)
            }).catch(reject)
        })
    })
}
