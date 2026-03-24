import type { AppContext } from '../types'

function handleHealth(c: AppContext) {
  return c.json({
    service: 'minibili-server',
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}

async function handleIndexPage(c: AppContext) {
  return c.env.ASSETS.fetch(new URL('/index.html', c.req.url))
}

export { handleHealth, handleIndexPage }
