const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const finalhandler = require('finalhandler')
const http = require('http')
const serveStatic = require('serve-static')

const rootDir = path.resolve(__dirname, './dist')
const indexPath = path.join(rootDir, 'index.html')
const indexhtmlcontent = fs.readFileSync(indexPath, 'utf8')
fs.writeFileSync(indexPath, indexhtmlcontent.replace('type="module"', ''))

const serve = serveStatic(rootDir)
// Create server
const server = http.createServer(function onRequest(req, res) {
  serve(req, res, finalhandler(req, res))
})
// Listen
const port = process.env.PORT || 3333
server.listen(port)

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', (e) => {
  console.error(e)
})
console.log('Start prerendering...')
module.exports = JSDOM.fromURL(`http://localhost:${port}`, {
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole,
  beforeParse(window) {
    window.__prerender = true;
    window.fetch = window.fetch || ((url, option) => {
      return fetch('http://localhost:' + port + url, option)
    });
    window.onerror = e => {
      console.log('Runtime error:')
      console.error(e)
    }
  }
}).then(dom => {
  const stylesheets = []
  dom.window.document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    stylesheets.push(fs.readFileSync(path.join(rootDir, link.getAttribute('href')), 'utf8'))
    link.remove()
  })
  const style = dom.window.document.createElement('style')
  style.textContent = stylesheets.join('\n')
  dom.window.document.head.appendChild(style)
  const version = dom.window.document.querySelector('meta[name="version"]')
  version.content = [require('./package.json').version, Date.now()] + ''
  return new Promise(resolve => {
    dom.window.onload = () => {
      setTimeout(() => {
        server.close()
        const prerenderhtml = dom.serialize()
        dom.window.close()
        fs.writeFileSync(indexPath, prerenderhtml)
        resolve()
        console.log('Prerender done.')
      });
    }
  })
});
