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
  style.textContent = `
  body .pswp__counter { font-size: 18px; }
  `
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
  lightbox.on('uiRegister', function () {
    lightbox.pswp.ui.registerElement({
      name: 'download-button',
      order: 8,
      isButton: true,
      tagName: 'a',
      html: {
        isCustomSVG: true,
        inner:
          '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
        outlineID: 'pswp__icn-download',
      },
      // @ts-ignore
      onInit: (el, pswp) => {
        el.setAttribute('download', '')
        el.setAttribute('target', '_blank')
        el.setAttribute('rel', 'noopener')

        pswp.on('change', () => {
          console.log('change')
          el.href = pswp.currSlide.data.src
        })
      },
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
  // @ts-ignore
  lightbox.loadAndOpen(window.currentImgIndex, {
    gallery,
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
  // if (!imagesList.length) {
  //   return null
  // }
  // React.useEffect(() => {
  //   throw new Error('sdfsdf')
  // }, [])
  return (
    <Overlay
      isVisible={imagesList.length > 0}
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
