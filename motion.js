import { useLayoutEffect, useState } from 'react'

const glide = 'cubic-bezier(.16,.78,.18,1)'

export function usePortfolioMotion(heroRef) {
  const [override, setOverride] = useState(() => {
    try { return localStorage.getItem('portfolio-entry-motion') } catch { return null }
  })
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const enabled = override ? override === 'on' : !reduced
  useLayoutEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  useLayoutEffect(() => {
    const home = heroRef.current
    const page = home.parentElement
    const headings = [...page.querySelectorAll('.sectionHeading')]
    let stop = () => {}

    function setup() {
      stop()
      if (!enabled || !Element.prototype.animate) return
      const animations = new Set()
      function play(node, frames, duration, delay=0) {
        if (!node) return
        const animation = node.animate(frames, {duration, delay, easing:glide, fill:'backwards'})
        animations.add(animation)
        animation.onfinish = () => animations.delete(animation)
      }
      const lineFrames = [
        {transform:'translate3d(-.09em,112%,0) skewY(7deg) scale(.84,.74)'},
        {transform:'none'}
      ]
      const lift = [{transform:'translate3d(0,60px,0) scale(.975)'},{transform:'none'}]
      if ((!location.hash || location.hash === '#home') && scrollY < home.offsetHeight / 2) {
        home.querySelectorAll('.openingBlade').forEach((blade,i)=>play(blade,[
          {transform:'scaleY(1)'},{transform:'scaleY(0)'}
        ],1450,100+i*115))
        play(home.querySelector('video'),[{transform:'scale(1.085)'},{transform:'scale(1)'}],2450)
        home.querySelectorAll('.titleInk').forEach((line,i)=>play(line,lineFrames,1540,340+i*215))
        for (const [selector,delay] of [['.eyebrow',430],['.heroCopy p',890],['.heroCopy .action',1010],['.heroFoot',750]]) {
          play(home.querySelector(selector),[{clipPath:'inset(0 100% 0 0)',transform:'translateY(12px)'},{clipPath:'inset(0)',transform:'none'}],1050,delay)
        }
      }

      const starts = new Map()
      function prepareHeading(heading) {
        heading.dataset.entry = 'ready'
      }
      headings.forEach(prepareHeading)
      // Re-arm below the physical viewport, never while the reader is looking at the title.
      const reset = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.boundingClientRect.top >= innerHeight)
            prepareHeading(entry.target)
        }
      })
      headings.forEach(heading => reset.observe(heading))
      const observer = new IntersectionObserver(entries=>{
        const batches = new Map()
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const node = entry.target
          if (!node.matches('.sectionHeading')) observer.unobserve(node)
          const section = node.closest('section')
          if (!batches.has(section)) batches.set(section,[])
          batches.get(section).push(node)
        }
        for (const [section,nodes] of batches) {
          const title = nodes.find(n=>n.matches('.sectionHeading'))
          if (title && title.dataset.entry === 'ready') {
            title.dataset.entry = 'shown'
            starts.set(section,performance.now())
            title.querySelectorAll('.titleInk').forEach((line,i)=>play(line,lineFrames,1350,i*130))
          }
          const elapsed = performance.now() - (starts.get(section) ?? -Infinity)
          nodes.filter(n=>n!==title).forEach((node,i)=>{
            const delay = Math.max(0,640-elapsed)+i*155
            play(node,lift,1160,delay)
            const image = node.matches('.portraitMask') ? node : node.querySelector('.projectTilt')
            if (image) play(image,[{clipPath:'inset(0 0 92% 0)'},{clipPath:'inset(0)'}],1260,delay)
          })
        }
      },{rootMargin:'0px 0px -17% 0px'})
      page.querySelectorAll('.sectionHeading,.bio > *,.project,.skillTilt,.contactInner > h4,.contactInner > a').forEach(node=>observer.observe(node))
      const additions = new MutationObserver(records=>{
        for(const record of records) for(const node of record.addedNodes)
          if(node.nodeType===1 && node.matches('.project')) observer.observe(node)
      })
      const grid=page.querySelector('.grid')
      if(grid)additions.observe(grid,{childList:true})
      stop = () => { additions.disconnect(); observer.disconnect(); reset.disconnect(); headings.forEach(h=>delete h.dataset.entry); animations.forEach(animation=>animation.cancel()); animations.clear() }
    }
    setup()
    return () => stop()
  },[heroRef,enabled])

  function toggle() {
    const value = enabled ? 'off' : 'on'
    setOverride(value)
    try { localStorage.setItem('portfolio-entry-motion',value) } catch {}
  }
  return {enabled,toggle}
}
