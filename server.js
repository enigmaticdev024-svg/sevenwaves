/**
 * Host startup entry. Delegates to the standalone server produced by
 * `output: 'standalone'`, which lives at `.next/standalone/server.js`.
 */
const path = require('node:path')

require(path.join(__dirname, '.next', 'standalone', 'server.js'))
