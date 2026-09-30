/**
 * Next's standalone output omits `public/` and `.next/static`. Copy them in
 * so `node server.js` can serve assets without the full Next CLI.
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const standalone = path.join(root, '.next', 'standalone')

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  console.error('Missing .next/standalone/server.js. Run `npm run build` first.')
  process.exit(1)
}

const publicDir = path.join(root, 'public')
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(standalone, 'public'), { recursive: true })
}

fs.cpSync(
  path.join(root, '.next', 'static'),
  path.join(standalone, '.next', 'static'),
  { recursive: true },
)

console.log('standalone server ready: node server.js')
