import React from 'react'
import { Linking, StyleSheet } from 'react-native'
import { Overlay } from '@rneui/themed'
import { useNetInfo } from '@react-native-community/netinfo'
import store, { useStore } from '../store'
import WebView from 'react-native-webview'

function __$hack() {
  const gallery = document.createElement('div')
  document.body.appendChild(gallery)
  const style = document.createElement('style')
  style.textContent = 'body .pswp__counter { font-size: 18px; }'
  document.head.appendChild(style)
  gallery.style.display = 'none'
  // @ts-ignore
  gallery.innerHTML = window.images
    // @ts-ignore
    .map(img => {
      return `
    <a href="${img.src}" data-pswp-width="${img.width}" data-pswp-height="${img.height}">
      <img src="${img.src}" alt="" />
    </a>
    `
    })
    .join('')
  // @ts-ignore
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: 'a',
    // @ts-ignore
    pswpModule: PhotoSwipe,
    closeOnVerticalDrag: false,
    clickToCloseNonZoomable: false,
    pinchToClose: false,
    loop: false,
  })
  // @ts-ignore
  lightbox.loadAndOpen(window.currentImgIndex, {
    gallery,
  })
  lightbox.on('openingAnimationEnd', () => {
    const zoomButton = document.querySelector('.pswp__button')
    // @ts-ignore
    const openButton = zoomButton.cloneNode(true)
    // @ts-ignore
    openButton.className = 'pswp__button'
    // @ts-ignore
    zoomButton.parentElement.insertBefore(openButton, zoomButton)
    // @ts-ignore
    openButton.title = 'open'
    // @ts-ignore
    openButton.setAttribute('aria-label', 'open')
    // @ts-ignore
    openButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512">
    <path fill="white" stroke="black" stroke-width="1" d="M224 304a16 16 0 0 1-11.31-27.31l157.94-157.94A55.7 55.7 0 0 0 344 112H104a56.06 56.06 0 0 0-56 56v240a56.06 56.06 0 0 0 56 56h240a56.06 56.06 0 0 0 56-56V168a55.7 55.7 0 0 0-6.75-26.63L235.31 299.31A15.92 15.92 0 0 1 224 304Z"/>
    <path fill="white" stroke="black" stroke-width="1" d="M448 48H336a16 16 0 0 0 0 32h73.37l-38.74 38.75a56.35 56.35 0 0 1 22.62 22.62L432 102.63V176a16 16 0 0 0 32 0V64a16 16 0 0 0-16-16Z"/></svg>
    `
    // @ts-ignore
    openButton.addEventListener('click', () => {
      // @ts-ignore
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'current-index',
          // @ts-ignore
          payload: window.pswp.currIndex,
        }),
      )
    })
  })
  lightbox.on('close', () => {
    // @ts-ignore
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        action: 'close',
        payload: '',
      }),
    )
  })
  lightbox.on('destroy', () => {
    // @ts-ignore
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        action: 'close',
        payload: '',
      }),
    )
  })
}

const a = inlineRequire('photoswipe/dist/umd/photoswipe-lightbox.umd.min.js')
const b = inlineRequire('photoswipe/dist/umd/photoswipe.umd.min.js')
const c = inlineRequire('photoswipe/dist/photoswipe.css')

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>images</title>
  <script> window.setImages = ${__$hack} </script>
  <script>
  ${a}
  ${b}
  </script>
  <style> ${c} </style>
</head>
<body style="background-color: #222;"></body>
</html>
`

export default React.memo(function ImagesView() {
  const { imagesList, currentImageIndex } = useStore()
  const netinfo = useNetInfo()
  const webviewRef = React.useRef<WebView | null>(null)
  if (!imagesList.length) {
    return null
  }
  return (
    <Overlay
      isVisible={true}
      fullScreen
      overlayStyle={styles.overlay}
      onBackdropPress={() => {
        store.imagesList = []
        store.currentImageIndex = 0
      }}>
      <WebView
        originWhitelist={['*']}
        ref={webviewRef}
        source={{ html }}
        onLoad={() => {
          webviewRef.current?.injectJavaScript(`
          window.images = ${JSON.stringify(imagesList)};
          window.currentImgIndex = ${currentImageIndex};
          window.isWifi = ${netinfo.type === 'wifi'};
          window.setImages && window.setImages();
          true;
        `)
        }}
        onMessage={evt => {
          const data = JSON.parse(evt.nativeEvent.data) as any
          if (data.action === 'current-index') {
            Linking.openURL(imagesList[data.payload].src)
          }
          if (data.action === 'close') {
            store.imagesList = []
            store.currentImageIndex = 0
          }
        }}
      />
    </Overlay>
  )
})

const styles = StyleSheet.create({
  pagerImage: {
    width: '100%',
  },
  overlay: {
    padding: 0,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
})
