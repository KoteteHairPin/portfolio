import React,{useState,useRef,useEffect} from 'react'
import {createRoot} from 'react-dom/client'
const loadSeed = () => import('./projects.json').then(module=>module.default)
const Manager = React.lazy(()=>import('./Manager'))
const MoltenMetal = React.lazy(()=>import('./MoltenMetal'))
import TiltedCard, { TiltedCardLayer } from './TiltedCard'
import {usePortfolioMotion} from './motion'
import './style.css'

const email='18222557741@163.com'
const skills=[
 ['Graphic Design','平面与品牌','从标志、品牌规范到应用物料，为凤翎航空建立统一的视觉语言。'],
 ['UI Design','界面与交互','通过信息架构、原型和界面设计，梳理航空出行与游戏中的操作路径。'],
 ['AIGC Design','生成式创作','将生成式工具融入概念探索、产品场景构思与视觉细化。']
]
function Mark(){return <svg viewBox="0 0 50 36" className="mark" aria-hidden="true"><path fill="currentColor" d="M0 3h9l7 11L24 3h9L17 26v8H9v-9L0 11zm22 30L42 3h8L30 33z"/></svg>}
const metalColors = ['#d2fd9a', '#f4f5ef']

function PortfolioBackground() {
  const [ready,setReady]=useState(false)
  useEffect(()=>{
    const timer = setTimeout(()=>setReady(true),1600)
    return ()=>clearTimeout(timer)
  },[])
  return <div className="portfolioBackground" aria-hidden="true">
    {ready&&<React.Suspense fallback={null}><MoltenMetal dpr={0.8} colors={metalColors} coreColor="#FFFFFF" speed={0.35}
      scale={4} detail={3} glow={1.6} thickness={1} haze={0.75}
      mouseInteraction flareOnClick /></React.Suspense>}
  </div>
}
const tiltProps = {
  containerWidth: '100%', containerHeight: '100%', imageWidth: '100%', imageHeight: '100%',
  rotateAmplitude: 12, scaleOnHover: 1.05, glare: 0.5, glareColor: '#80ff44', shadow: 0.5, radius: 2,
  gyroscope: false, intro: false, showTooltip: false
}

const previewCovers = {
  "/work/project-4-1.jpg": "/work/project-4-1-preview.webp",
  "/work/project-1-1.jpg": "/work/project-1-1-preview.webp",
  "/work/project-2-1.jpg": "/work/project-2-1-preview.webp",
  "/work/project-3-1.jpg": "/work/project-3-1-preview.webp",
  "/work/project-5-1.jpg": "/work/project-5-1-preview.webp",
  "/work/project-6-1.jpg": "/work/project-6-1-preview.webp"
}
const cardObservers = new Map()
let nearViewport
function useCardReady() {
  const ref=useRef(null),[ready,setReady]=useState(false)
  useEffect(()=>{
    if (!nearViewport) nearViewport=new IntersectionObserver(entries=>{
      for (const entry of entries) if(entry.isIntersecting) {
        cardObservers.get(entry.target)?.()
        nearViewport.unobserve(entry.target)
        cardObservers.delete(entry.target)
      }
    },{rootMargin:'300px 0px'})
    const el=ref.current
    cardObservers.set(el,()=>setReady(true))
    nearViewport.observe(el)
    return ()=>{nearViewport.unobserve(el);cardObservers.delete(el)}
  },[])
  return [ref,ready]
}
function ProjectCard({ project, index, openGallery }) {
  const [ref,ready]=useCardReady()
  return <div className="project">
    <div className="projectTilt" ref={ref}>
      {ready&&<TiltedCard {...tiltProps} imageSrc={previewCovers[project.cover]||project.cover} altText={project.title}
        captionText={project.title + '，翻面查看项目介绍'}
        backContent={<div className="tiltBack"><strong>{project.title}</strong><p>{project.description}</p></div>}>
        <TiltedCardLayer depth={30}><span className="flipHint">翻面 ↻</span></TiltedCardLayer>
      </TiltedCard>}
    </div>
    <button className="projectInfo galleryEntry" onClick={openGallery} aria-label={'查看' + project.title + '图集'}>
      <small>{String(index+1).padStart(2,'0')} / {project.category}</small><h4>{project.title}</h4><i>{project.images.length} 张 · 查看图集 ↗</i>
    </button>
  </div>
}

function MotionLine({children}) {
  return <b className="titleMask"><b className="titleInk">{children}</b></b>
}

function App({projects,owner=false}){
 const [active,setActive]=useState('home'),[project,setProject]=useState(null),[slide,setSlide]=useState(0),[paused,setPaused]=useState(true)
 const [floating,setFloating]=useState(false)
 const hero=useRef(null)
 const motion=usePortfolioMotion(hero)
 const dialog=useRef(null),video=useRef(null),manualPause=useRef(false)
 useEffect(()=>{
   const player = video.current
   player.defaultMuted = true
   player.muted = true
   let onScreen=hero.current.getBoundingClientRect().bottom>0
   function sync(){
     if(document.hidden || !onScreen || manualPause.current) player.pause()
     else player.play().catch(()=>setPaused(player.paused))
   }
   const observer=new IntersectionObserver(([entry])=>{onScreen=entry.isIntersecting;sync()})
   observer.observe(hero.current)
   document.addEventListener('visibilitychange',sync)
   sync()
   return ()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync)}
 },[])

 useEffect(()=>{
   const observer=new IntersectionObserver(([entry])=>{
     setFloating(entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 80))
   },{rootMargin:'-80px 0px 0px 0px'})
   observer.observe(hero.current)
   return ()=>observer.disconnect()
 },[])
 useEffect(()=>{const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(e.target.id)}),{rootMargin:'-20% 0px -50%'});document.querySelectorAll('section[id]').forEach(el=>obs.observe(el));return ()=>obs.disconnect()},[])
 useEffect(()=>{if(project){dialog.current.showModal();document.body.style.overflow='hidden'}return ()=>{document.body.style.overflow=''}},[project])
 function turn(offset){setSlide(n=>(n+offset+project.images.length)%project.images.length)}
 const links=[['home','首页'],['about','关于我'],['work','全部作品'],['skills','个人优势']]
 return <><PortfolioBackground/><header className={floating ? "floatingNav" : undefined}><div className="nav"><a className="brand" href="#home"><Mark/><b>YANG<span>®</span></b></a><nav>{links.map(([id,t])=><a key={id} className={active===id?'active':''} href={'#'+id}>{t}</a>)}</nav><div className="navActions"><button className="motionSwitch" aria-label={motion.enabled?'关闭入场动效':'开启入场动效'} aria-pressed={motion.enabled} onClick={motion.toggle}>{motion.enabled?'动效已开':'开启动效'}</button><a className="contactBtn" href="#contact">联系我 <i>↗</i></a></div></div></header>
 <section ref={hero} id="home" className="hero"><div className="stage"><video ref={video} muted playsInline loop autoPlay preload="auto" poster="/cover-poster.webp" onPlay={()=>setPaused(false)} onPause={()=>setPaused(true)}><source media="(max-width: 760px)" src="/cover-480p.mp4" type="video/mp4"/><source src="/cover-720p.mp4" type="video/mp4"/></video><div className="veil"/><div className="openingShutter" aria-hidden="true"><i className="openingBlade"/><i className="openingBlade"/><i className="openingBlade"/></div><div className="rules" aria-hidden="true"/><div className="topline"><span>◉　VISUAL PORTFOLIO</span><span>YANG MINGYANG　/　2026</span></div><div className="heroCopy"><div className="eyebrow"><b className="dot"/> 杨明阳　 /　跨领域视觉设计师</div><h1 aria-label="Visual Design"><MotionLine>VISUAL</MotionLine><MotionLine>DESIGN<span className="star">✳</span></MotionLine></h1><p>平面设计　 /　 UI 设计　 /　 AIGC 设计</p><a className="action" href="#work">浏览全部作品 <b>↗</b></a></div><div className="heroFoot"><a href="#about"><span>↓</span> SCROLL TO EXPLORE</a><div className="playPanel">MOTION COVER　 /　01 <button aria-label={paused?'播放动态背景':'暂停动态背景'} onClick={()=>{manualPause.current=!video.current.paused;if(manualPause.current)video.current.pause();else video.current.play().catch(()=>setPaused(true))}}>{paused?'▷':'Ⅱ'}</button></div></div></div></section>
 <main><section id="about"><div className="label">01 / 关于我</div><h3 className="sectionHeading editorialTitle"><MotionLine>ABOUT ME</MotionLine></h3><div className="bio"><div className="portraitMask"><img loading="lazy" decoding="async" width="800" height="1120" src="/portrait-color.webp" alt="杨明阳个人肖像"/></div><div><h4>杨明阳</h4><p>我就读于山东理工大学数字媒体技术专业，关注品牌视觉、数字界面与 AIGC 创作。我的项目从航空品牌的视觉系统延伸到游戏界面和电商产品图。</p><p>2023.09 — 2027.06　山东理工大学 · 本科<br/>BTV 卡酷少儿栏目组 · 摄制助理实习<br/>校级组织互联创新部 · 副部长</p><a href={'mailto:'+email}>{email} ↗</a></div><div className="stats"><strong>{String(projects.length).padStart(2,'0')}</strong>项目图集<strong>03</strong>设计方向</div></div></section>
 <section id="work"><div className="label">02 / 全部作品</div><h3 className="workTitle sectionHeading"><MotionLine>ALL</MotionLine><MotionLine>WORKS<sup>({String(projects.length).padStart(2,'0')})</sup></MotionLine></h3><div className="grid">{projects.map((p,n)=><ProjectCard key={n} project={p} index={n}
   openGallery={()=>{setSlide(0);setProject(p)}}/>)}</div></section>
 <section id="skills"><div className="label">03 / 个人优势</div><h3 className="sectionHeading editorialTitle"><MotionLine>CAPABILITIES</MotionLine></h3><div className="skills">{skills.map(([en,cn,desc],i)=><div className="skillTilt" key={en}>
   <TiltedCard {...tiltProps} captionText={cn + '，翻面查看能力说明'}
     backContent={<div className="tiltBack"><strong>{cn}</strong><p>{desc}</p></div>}>
     <TiltedCardLayer depth={30}><div className="skillFace"><b>{['✳','⊞','✧'][i]}</b>
       <small>{en}</small><h4>{cn}</h4><span className="flipHint">翻面 ↻</span></div></TiltedCardLayer>
   </TiltedCard></div>)}</div></section></main>
 <section id="contact"><div className="contactInner"><div className="label">04 / CONTACT</div><h3 className="sectionHeading"><MotionLine>Let’s talk<strong>.</strong></MotionLine></h3><h4>聊聊下一个设计项目</h4><a className="mail" href={'mailto:'+email}>{email} ↗</a><a href="tel:18222557741">182 2255 7741</a></div><footer>{owner&&<a href="/?manage">管理作品</a>}© 2026 YANG MINGYANG <a href="#home">回到顶部 ↑</a></footer></section>
 <dialog ref={dialog} onClose={()=>setProject(null)} onKeyDown={e=>{if(e.target.tagName==='SELECT')return;if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1)}}>{project&&<><div className="dialogHead"><h4>{project.title}</h4><button onClick={()=>dialog.current.close()} aria-label="关闭">×</button></div><a className="fullPage" href={project.images[slide]} target="_blank" rel="noreferrer" aria-label="在新标签页放大查看整张作品"><img src={project.images[slide]} alt={project.labels[slide]}/></a><div className="pagePicker"><label>跳转页面 <select value={slide} onChange={e=>setSlide(Number(e.target.value))}>{project.labels.map((label,i)=><option key={i} value={i}>{i+1} · {label}</option>)}</select></label><a href={project.images[slide]} target="_blank" rel="noreferrer">放大查看 ↗</a></div><div className="controls"><button onClick={()=>turn(-1)}>← 上一张</button>{slide+1} / {project.images.length}<button onClick={()=>turn(1)}>下一张 →</button></div></>}</dialog></>}
function Published() {
  const [projects,setProjects]=useState(null),[owner,setOwner]=useState(false),[error,setError]=useState(false)
  useEffect(()=>{
    if (__PAGES_SHOWCASE__) {
      import('./pages-catalog.json').then(module=>setProjects(module.default)).catch(()=>setError(true))
      return
    }
    fetch('/api/catalog').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>d.projects??loadSeed()).then(setProjects).catch(()=>setError(true))
    fetch('/api/access').then(r=>r.json()).then(d=>setOwner(d.owner)).catch(()=>{})
  },[])
  useEffect(()=>{if(projects && location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView()},[projects])
  if(error)return <p>作品暂时无法载入。<button onClick={()=>location.reload()}>重试</button></p>
  return <App projects={projects??[]} owner={owner}/>
}
createRoot(document.getElementById('root')).render(!__PAGES_SHOWCASE__ && new URLSearchParams(location.search).has('manage') ? <React.Suspense fallback={null}><Manager Portfolio={App}/></React.Suspense> : <Published/>)
