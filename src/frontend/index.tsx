import { createTimeline, text, stagger } from 'animejs'
import { useRef, useEffect } from 'preact/hooks'
import { Switch, Route } from 'wouter-preact'
import * as tauri from '@tauri-apps/api'
import { render } from 'preact'

import Library from './scripts/Library'

import Header from './components/Header'
import Create from './screens/Create'
import Import from './screens/Import'
import Home from './screens/Home'

// The top-level APP body.
const App = () => {
  const titleRefrence = useRef<HTMLHeadingElement>(null)
  const backgroundRefrence = useRef<HTMLDivElement>(null)
  const pageRefrence = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (titleRefrence.current !== null) {
      createTimeline()
        .add(text.split(titleRefrence.current, { chars: true }).chars, {
          y: ['25%', '0%'],
          scaleY: [1.75, 1],

          duration: 300,
          ease: 'outBack',
          delay: stagger(100)
        })
        .then(async () => {
          await Library.scan()

          if (titleRefrence.current !== null && backgroundRefrence.current !== null && pageRefrence.current !== null) {
            createTimeline()
              .add(backgroundRefrence.current, {
                'clip-path': ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'],

                duration: 1200,
                ease: 'inOutExpo'
              }, 0)
              .add(titleRefrence.current, {
                scale: [1, 0.75],
                opacity: [1, 0],

                duration: 1200,
                ease: 'inOutExpo'
              }, 0)
              .add(pageRefrence.current, {
                y: ['100dvw', '0rem'],
                scaleY: [2, 1],
                opacity: [0, 1],

                duration: 1200,
                ease: 'inOutExpo'
              }, 0)
              .then(() => {
                backgroundRefrence.current!.remove()
                pageRefrence.current!.style.pointerEvents = 'auto'
              })
          } 
        })
    }
  })

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div ref={pageRefrence} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', opacity: 0, pointerEvents: 'none' }}>
        <Header/>

        <Switch>
          <Route path='/' component={Home}/>
          <Route path='/create' component={Create}/>
          <Route path='/import' component={Import}/>
        </Switch>
      </div>

      <div ref={backgroundRefrence} style={{ position: 'fixed', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-container-dark)', left: '0rem', top: '0rem', width: '100%', height: '100%' }}>
        <h2 ref={titleRefrence} style={{ fontSize: '5rem', whiteSpace: 'nowrap', pointerEvents: 'none' }}>Waraja</h2>
      </div>
    </div>
  )
}

render(<App/>, document.getElementById('app')!)
tauri.window.getCurrentWindow().show()

if (import.meta.env.MODE === 'production') {
  window.addEventListener('contextmenu', (event) => event.preventDefault())
}
