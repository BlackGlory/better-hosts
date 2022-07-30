import { fileURLToPath } from 'url'

export default {
  target: 'node'
, mode: 'none'
, node: {
    global: true,
    __filename: true,
    __dirname: true,
  }
, entry: './lib/cli.js'
, output: {
    path: fileURLToPath(new URL('dist', import.meta.url))
  , filename: 'cli.js'
  }
, externals: {
    'fsevents': 'commonjs fsevents'
  }
}
