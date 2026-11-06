const json = (body, status=200) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}})
const ownerEmail = '1834648106@qq.com'
const stateKey = 'catalog/state.json'
const mediaPath = /^\/media\/[0-9a-f-]{36}\.(png|jpg|webp)$/
const assetPath = /^\/(archive|work)\/[a-z\d-]+\.(webp|jpg)$/
function validCatalog(items) {
  const text = (value,max) => typeof value === 'string' && value.length <= max
  const image = value => typeof value === 'string' && (mediaPath.test(value) || assetPath.test(value))
  return Array.isArray(items) && items.length <= 500 && items.every(p => p &&
    text(p.title,180) && p.title.trim() && text(p.category,180) && text(p.description,4000) &&
    Array.isArray(p.images) && Array.isArray(p.labels) && p.images.length === p.labels.length &&
    p.images.length <= 4000 && p.images.every(image) && p.labels.every(v=>text(v,500)) &&
    (p.images.length ? image(p.cover) : p.cover === ''))
}

export default {async fetch(req,env) {
  const url = new URL(req.url), path = url.pathname
  const owner = Boolean(req.headers.get('oai-authenticated-user-id')) &&
    req.headers.get('oai-authenticated-user-email')?.toLowerCase() === ownerEmail
  if (path === '/api/access') return json({owner})
  if (!path.startsWith('/api/') && !path.startsWith('/media/')) {
    if (path === '/' || path === '/index.html') return new Response(APP_HTML,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-cache'}})
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response('Not found',{status:404})
  }
  const write = req.method !== 'GET'
  if ((write || path === '/api/draft') && !owner) return json({error:'仅站主可管理作品'},403)
  if (write && req.headers.get('Origin') !== url.origin) return json({error:'请求来源无效'},403)
  const bucket = env.BUCKET
  if (path === '/api/upload' && req.method === 'POST') {
    const type = req.headers.get('Content-Type'), ext = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type]
    const size = Number(req.headers.get('Content-Length'))
    if (!ext || !size || size > 12*1024*1024) return json({error:'请选择 12 MB 以内的 JPG、PNG 或 WebP 图片'},400)
    const bytes = new Uint8Array(await req.arrayBuffer())
    const matches = ext === 'jpg' ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255 :
      ext === 'png' ? [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v) :
      String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP'
    if (!matches) return json({error:'文件格式与图片内容不符'},400)
    const key = 'media/'+crypto.randomUUID()+'.'+ext
    await bucket.put(key,bytes,{httpMetadata:{contentType:type}})
    return json({path:'/'+key})
  }
  const entry = await bucket.get(stateKey)
  const state = entry ? await entry.json() : {draft:null,published:null}
  // Apply the requested initial order to existing catalogs once per stored state.
  if (!state.albumOrderVersion) {
    for (const albums of [state.draft, state.published]) {
      if (!Array.isArray(albums)) continue
      const index = albums.findIndex(p => p.title.replace(/\s+/g, '').toLowerCase() === '跟着sissi去旅行')
      if (index > 0) albums.unshift(albums.splice(index, 1)[0])
    }
    state.albumOrderVersion = 1
  }
  if (path === '/api/catalog' && !write) return json({projects:state.published})
  if (mediaPath.test(path) && !write) {
    if (!owner && !state.published?.some(p=>p.cover===path || p.images.includes(path))) return new Response(null,{status:404})
    const obj = await bucket.get(path.slice(1))
    return obj ? new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata.contentType,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-cache'}}) : new Response(null,{status:404})
  }
  if (path === '/api/draft' && !write) return json({projects:state.draft ?? state.published,revision:entry?.etag ?? ''})
  if (req.method !== 'POST' || !['/api/draft','/api/publish'].includes(path)) return json({error:'无效请求'},404)
  if (Number(req.headers.get('Content-Length'))>2_000_000) return json({error:'图集清单过大'},413)
  const data = await req.json()
  if (!validCatalog(data.projects)) return json({error:'请检查图集名称、封面和页面数据'},400)
  if (data.revision !== (entry?.etag ?? '')) return json({error:'另一窗口已经保存了新版，请重新载入后再编辑'},409)
  state.draft = data.projects
  if (path === '/api/publish') {
    if (state.draft.some(p=>!p.images.length)) return json({error:'请先给空图集添加图片，或移除空图集'},400)
    state.published = state.draft
  }
  const saved = await bucket.put(stateKey,JSON.stringify(state),{onlyIf:entry ? {etagMatches:entry.etag} : {etagDoesNotMatch:'*'}})
  return saved ? json({revision:saved.etag}) : json({error:'草稿已在其他窗口更新，请重新载入'},409)
}}
