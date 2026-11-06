import { mkdir, readFile, writeFile, cp } from 'node:fs/promises'
const html = await readFile('dist/client/index.html','utf8')
const source = await readFile('worker.mjs','utf8')
await mkdir('dist/server',{recursive:true})
await writeFile('dist/server/index.js','const APP_HTML = '+JSON.stringify(html)+';\n'+source)
await cp('.openai','dist/.openai',{recursive:true})
