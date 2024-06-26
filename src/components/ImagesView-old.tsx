import { useNetInfo } from '@react-native-community/netinfo'
import { Overlay } from '@rneui/themed'
import React from 'react'
import { Linking } from 'react-native'
import WebView from 'react-native-webview'

import { useStore } from '../store'

function __$hack() {
  const gallery = document.createElement('div')
  document.body.appendChild(gallery)
  const style = document.createElement('style')
  style.textContent = `
  body .pswp__counter { font-size: 18px; }
  .picture {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  `
  document.head.appendChild(style)
  gallery.style.opacity = '0'
  // @ts-ignore
  gallery.innerHTML = window.images
    // @ts-ignore
    .map((img) => {
      return `
    <a href="${img.src}" data-pswp-width="${img.width}" data-pswp-height="${img.height}">
      <img src="${img.src}" class="picture" alt="" />
    </a>
    `
    })
    .join('')
  // @ts-ignore
  // eslint-disable-next-line no-undef
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: 'a',
    // @ts-ignore
    // eslint-disable-next-line no-undef
    pswpModule: PhotoSwipe,
    closeOnVerticalDrag: false,
    clickToCloseNonZoomable: false,
    pinchToClose: false,
    loop: false,
  })
  lightbox.on('uiRegister', () => {
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
  // lightbox.init()
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

export default React.memo(ImagesView)

function ImagesView() {
  const { imagesList, currentImageIndex, setImagesList, setCurrentImageIndex } =
    useStore()

  const netinfo = useNetInfo()
  const webviewRef = React.useRef<WebView | null>(null)
  return (
    <Overlay
      isVisible={imagesList.length > 0}
      fullScreen
      overlayStyle={tw('p-0 m-0')}
      onBackdropPress={() => {
        setImagesList([])
        setCurrentImageIndex(0)
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
        onMessage={(evt) => {
          const data = JSON.parse(evt.nativeEvent.data) as any
          if (data.action === 'current-index') {
            Linking.openURL(imagesList[data.payload].src)
          }
          if (data.action === 'close') {
            setImagesList([])
            setCurrentImageIndex(0)
          }
        }}
      />
    </Overlay>
  )
}
