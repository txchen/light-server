const Koa = require('koa')
const Router = require('koa-router')
const serve = require('koa-static')
const historyFallback = require('koa2-history-api-fallback')

const app = new Koa()
const router = new Router()

router.get('/api/echo/(.*)', (ctx) => {
  // ctx.router available
  ctx.body = 'Echo from server: ' + ctx.req.url
})

router.get('/auth/(.*)', (ctx) => {
  // ctx.router available
  ctx.body = 'Auth check from server: ' + ctx.req.url
})

app.use(router.routes())
  .use(router.allowedMethods())

app.use(historyFallback())
app.use(serve('public'))

app.listen(8010, () => {
  console.log('koa server listening on http://localhost:8010')
})
