import React,{useState,useEffect} from 'react'
import seed from './projects.json'

async function api(path, options) {
  const res=await fetch('/api/'+path,options)
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || '请求失败，请重试')
  return res.json()
}
const blank=()=>({title:'新图集',category:'作品',description:'',images:[],labels:[],cover:''})

export default function Manager({Portfolio}) {
  const [items,setItems]=useState(null),[revision,setRevision]=useState(''),[index,setIndex]=useState(0)
  const [selected,select]=useState([]),[target,setTarget]=useState(''),[preview,setPreview]=useState(false)
  const [message,say]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false)
  useEffect(()=>{api('draft').then(d=>{setItems(d.projects??seed);setRevision(d.revision)}).catch(e=>say(e.message))},[])
  useEffect(()=>{function warn(e){if(dirty){e.preventDefault();e.returnValue=''}}window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty])
  function change(next){setItems(next);setDirty(true);say('有未保存的修改')}
  function go(i){setIndex(i);select([]);setTarget('')}
  const album=items?.[index]
  function edit(p){change(items.map((old,i)=>i===index?p:old))}
  function without(p,indices){
    const images=p.images.filter((_,i)=>!indices.includes(i))
    const cover=indices.some(i=>p.images[i]===p.cover)||!images.length ? images[0]||'' : p.cover
    return {...p,images,cover,labels:p.labels.filter((_,i)=>!indices.includes(i))}
  }
  function move(){
    const next=[...items], dest=target==='new'?next.length:Number(target)
    const to=next[dest]||blank(), indices=[...selected].sort((a,b)=>a-b)
    const images=indices.map(i=>album.images[i])
    next[index]=without(album,indices)
    next[dest]={...to,images:[...to.images,...images],labels:[...to.labels,...indices.map(i=>album.labels[i])],cover:to.cover||images[0]}
    change(next);go(dest)
  }
  function shift(dir){
    const from=selected[0],to=from+dir
    const images=[...album.images],labels=[...album.labels]
    ;[images[from],images[to]]=[images[to],images[from]]
    ;[labels[from],labels[to]]=[labels[to],labels[from]]
    edit({...album,images,labels});select([to])
  }
  async function save(publish) {
    setBusy(true)
    try {
      const result=await api(publish?'publish':'draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projects:items,revision})})
      setRevision(result.revision);setDirty(false);say(publish?'已发布，作品页现在显示此版本。':'草稿已保存到云端。')
    }catch(e){say(e.message)}finally{setBusy(false)}
  }
  async function upload(files){
    if(!files.length)return
    setBusy(true);let images=[],labels=[],failure=''
    try {for(const file of files){say('正在上传 '+file.name);const d=await api('upload',{method:'POST',headers:{'Content-Type':file.type},body:file});images.push(d.path);labels.push(file.name)}}
    catch(e){failure=e.message}
    finally{if(images.length)edit({...album,images:[...album.images,...images],labels:[...album.labels,...labels],cover:album.cover||images[0]});say(failure||'图片已加入，请保存草稿。');setBusy(false)}
  }
  if(preview)return <><button className="exitPreview" onClick={()=>setPreview(false)}>退出草稿预览</button><Portfolio projects={items.filter(p=>p.images.length)} /></>
  return <main className="manager"><a href="/">← 返回作品集</a><h1>管理作品</h1><p role="status">{message||(!items?'正在读取云端草稿…':'选择图集和图片，编辑后保存草稿或发布。')}</p>
  {items&&<fieldset disabled={busy}><div className="adminBar">
    <button onClick={()=>save(false)}>保存草稿</button><button onClick={()=>setPreview(true)}>预览草稿</button><button className="publish" onClick={()=>save(true)}>发布到作品集</button>
  </div><div className="adminLayout"><aside><button onClick={()=>{change([...items,blank()]);go(items.length)}}>＋ 新建图集</button>
  {items.map((p,i)=><button className={i===index?'picked':''} key={i} onClick={()=>go(i)}>{p.title}（{p.images.length}）</button>)}</aside>
  {album&&<div className="editAlbum"><label>图集名称<input value={album.title} maxLength={180} onChange={e=>edit({...album,title:e.target.value})}/></label>
  <label>作品分类<input value={album.category} onChange={e=>edit({...album,category:e.target.value})}/></label>
  <label>作品介绍<textarea value={album.description} onChange={e=>edit({...album,description:e.target.value})}/></label>
  <div className="adminBar"><label>添加图片<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>{upload([...e.target.files]);e.target.value=''}}/></label>
  <button onClick={()=>{if(confirm('从草稿移除整个图集？')){change(items.filter((_,i)=>i!==index));go(0)}}}>移除图集</button></div>
  <div className="adminBar"><button onClick={()=>select(selected.length===album.images.length?[]:album.images.map((_,i)=>i))}>全选 / 取消</button>
  <button disabled={!selected.length} onClick={()=>{edit(without(album,selected));select([])}}>移除所选（{selected.length}）</button>
  <button disabled={selected.length!==1} onClick={()=>edit({...album,cover:album.images[selected[0]]})}>设为封面</button>
  <button disabled={selected.length!==1||selected[0]===0} onClick={()=>shift(-1)}>前移</button><button disabled={selected.length!==1||selected[0]>=album.images.length-1} onClick={()=>shift(1)}>后移</button>
  <select aria-label="目标图集" value={target} onChange={e=>setTarget(e.target.value)}><option value="">选择目标图集</option><option value="new">拆成新图集</option>{items.map((p,i)=>i!==index&&<option key={i} value={i}>{p.title}</option>)}</select><button disabled={!target||!selected.length} onClick={move}>移动所选</button></div>
  <div className="adminImages">{album.images.map((src,i)=><label key={i} className={selected.includes(i)?'picked':''}><img loading="lazy" src={src} alt=""/><span><input type="checkbox" checked={selected.includes(i)} onChange={e=>select(e.target.checked?[...selected,i]:selected.filter(k=>k!==i))}/> {i+1} {src===album.cover?'· 封面':''}　{album.labels[i]}</span></label>)}</div>
  </div>}</div></fieldset>}</main>
}
