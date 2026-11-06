import React,{useState,useRef,useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import projects from './projects.json'
import MoltenMetal from './MoltenMetal'
import TiltedCard, { TiltedCardLayer } from './TiltedCard'
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
  return <div className="portfolioBackground" aria-hidden="true">
    <MoltenMetal colors={metalColors} coreColor="#FFFFFF" speed={0.35}
      scale={4} detail={3} glow={1.6} thickness={1} haze={0.75}
      mouseInteraction flareOnClick />
  </div>
}
const tiltProps = {
  containerWidth: '100%', containerHeight: '100%', imageWidth: '100%', imageHeight: '100%',
  rotateAmplitude: 12, scaleOnHover: 1.05, glare: 0.5, glareColor: '#80ff44', shadow: 0.5, radius: 2,
  gyroscope: false, intro: false, showTooltip: false
}

function ProjectCard({ project, index, openGallery }) {
  return <div className="project">
    <div className="projectTilt">
      <TiltedCard {...tiltProps} imageSrc={project.cover} altText={project.title}
        captionText={project.title + '，翻面查看项目介绍'}
        backContent={<div className="tiltBack"><strong>{project.title}</strong><p>{project.description}</p></div>}>
        <TiltedCardLayer depth={30}><span className="flipHint">翻面 ↻</span></TiltedCardLayer>
      </TiltedCard>
    </div>
    <button className="projectInfo galleryEntry" onClick={openGallery} aria-label={'查看' + project.title + '图集'}>
      <small>{String(index+1).padStart(2,'0')} / {project.category}</small><h4>{project.title}</h4><i>{project.images.length} 张 · 查看图集 ↗</i>
    </button>
  </div>
}

function App(){
 const [active,setActive]=useState('home'),[project,setProject]=useState(null),[slide,setSlide]=useState(0),[paused,setPaused]=useState(true)
 const [floating,setFloating]=useState(false)
 const hero=useRef(null)
 const dialog=useRef(null),video=useRef(null)
 useEffect(()=>{
   const player = video.current
   player.defaultMuted = true
   player.muted = true
   player.play().catch(()=>setPaused(player.paused))
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
 return <><PortfolioBackground/><header className={floating ? "floatingNav" : undefined}><div className="nav"><a className="brand" href="#home"><Mark/><b>YANG<span>®</span></b></a><nav>{links.map(([id,t])=><a key={id} className={active===id?'active':''} href={'#'+id}>{t}</a>)}</nav><a className="contactBtn" href="#contact">联系我 <i>↗</i></a></div></header>
 <section ref={hero} id="home" className="hero"><div className="stage"><video ref={video} muted playsInline loop autoPlay preload="auto" poster="/cover-b416c125.jpg" src="/cover-b416c125.mp4" onPlay={()=>setPaused(false)} onPause={()=>setPaused(true)}/><div className="veil"/><div className="rules" aria-hidden="true"/><div className="topline"><span>◉　VISUAL PORTFOLIO</span><span>YANG MINGYANG　/　2026</span></div><div className="heroCopy"><div className="eyebrow"><b className="dot"/> 杨明阳　 /　跨领域视觉设计师</div><h1>VISUAL<br/>DESIGN<span className="star">✳</span></h1><p>平面设计　 /　 UI 设计　 /　 AIGC 设计</p><a className="action" href="#work">浏览全部作品 <b>↗</b></a></div><a className="miniProject" href="#work"><img src={projects[0].cover} alt="不设限项目封面"/><span>全部作品 ↗</span></a><div className="heroFoot"><a href="#about"><span>↓</span> SCROLL TO EXPLORE</a><div className="playPanel">MOTION COVER　 /　01 <button aria-label={paused?'播放动态背景':'暂停动态背景'} onClick={()=>video.current.paused?video.current.play():video.current.pause()}>{paused?'▷':'Ⅱ'}</button></div></div></div></section>
 <main><section id="about"><div className="label">01 / PROFILE</div><h3>关于我<span>About me</span></h3><div className="bio"><img src="/portrait-color.jpg" alt="杨明阳个人肖像"/><div><h4>杨明阳</h4><p>我就读于山东理工大学数字媒体技术专业，关注品牌视觉、数字界面与 AIGC 创作。我的项目从航空品牌的视觉系统延伸到游戏界面和电商产品图。</p><p>2023.09 — 2027.06　山东理工大学 · 本科<br/>BTV 卡酷少儿栏目组 · 摄制助理实习<br/>校级组织互联创新部 · 副部长</p><a href={'mailto:'+email}>{email} ↗</a></div><div className="stats"><strong>{String(projects.length).padStart(2,'0')}</strong>项目图集<strong>03</strong>设计方向</div></div></section>
 <section id="work"><div className="label">02 / 全部作品</div><h3 className="workTitle">ALL<br/>WORKS<sup>({String(projects.length).padStart(2,'0')})</sup></h3><div className="grid">{projects.map((p,n)=><ProjectCard key={p.title} project={p} index={n}
   openGallery={()=>{setSlide(0);setProject(p)}}/>)}</div></section>
 <section id="skills"><div className="label">03 / CAPABILITIES</div><h3>个人优势<span>Capabilities</span></h3><div className="skills">{skills.map(([en,cn,desc],i)=><div className="skillTilt" key={en}>
   <TiltedCard {...tiltProps} captionText={cn + '，翻面查看能力说明'}
     backContent={<div className="tiltBack"><strong>{cn}</strong><p>{desc}</p></div>}>
     <TiltedCardLayer depth={30}><div className="skillFace"><b>{['✳','⊞','✧'][i]}</b>
       <small>{en}</small><h4>{cn}</h4><span className="flipHint">翻面 ↻</span></div></TiltedCardLayer>
   </TiltedCard></div>)}</div></section></main>
 <section id="contact"><div className="contactInner"><div className="label">04 / CONTACT</div><h3>Let’s talk<strong>.</strong></h3><h4>聊聊下一个设计项目</h4><a className="mail" href={'mailto:'+email}>{email} ↗</a><a href="tel:18222557741">182 2255 7741</a></div><footer>© 2026 YANG MINGYANG <a href="#home">回到顶部 ↑</a></footer></section>
 <dialog ref={dialog} onClose={()=>setProject(null)} onKeyDown={e=>{if(e.target.tagName==='SELECT')return;if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1)}}>{project&&<><div className="dialogHead"><h4>{project.title}</h4><button onClick={()=>dialog.current.close()} aria-label="关闭">×</button></div><a className="fullPage" href={project.images[slide]} target="_blank" rel="noreferrer" aria-label="在新标签页放大查看整张作品"><img src={project.images[slide]} alt={project.labels[slide]}/></a><div className="pagePicker"><label>跳转页面 <select value={slide} onChange={e=>setSlide(Number(e.target.value))}>{project.labels.map((label,i)=><option key={i} value={i}>{i+1} · {label}</option>)}</select></label><a href={project.images[slide]} target="_blank" rel="noreferrer">放大查看 ↗</a></div><div className="controls"><button onClick={()=>turn(-1)}>← 上一张</button>{slide+1} / {project.images.length}<button onClick={()=>turn(1)}>下一张 →</button></div></>}</dialog></>}
createRoot(document.getElementById('root')).render(<App/>)

