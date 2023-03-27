import './style.css'

import template from './app.html?raw'
import createApp from './template'

const render = createApp(template, {
  downloadLink: 'https://expo.dev/artifacts/eas/onu5qRcbURE9dh6DrGaHQT.apk',
  base: '/minibili/',
})

render('#app')
