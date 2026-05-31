import { copyFile, stat } from 'node:fs/promises'

const indexPath = new URL('../dist/index.html', import.meta.url)
const notFoundPath = new URL('../dist/404.html', import.meta.url)

await stat(indexPath)
await copyFile(indexPath, notFoundPath)

console.log('Created dist/404.html from dist/index.html for GCS SPA fallback.')
