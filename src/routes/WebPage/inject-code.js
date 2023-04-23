function __$hack() {
  const style = document.createElement('style')
  document.head.appendChild(style)
  style.textContent = `
  #app .m-navbar {
    display: none!important;
  }
  #app .m-opus {
    padding-top: 0;
  }
  #app .launch-app-btn.opus-module-author__action {
    display: none!important;
  }
  #app .dyn-card .dyn-header__right {
    display: none!important;
  }
  #app .launch-app-btn.dynamic-float-openapp.dynamic-float-btn {
    display: none!important;
  }
  #app .reply-list .reply-input {
    display: none!important;
  }
  #app .openapp-dialog {
    display: none!important;
  }
  #app .launch-app-btn.float-openapp.opus-float-btn {
    display: none!important;
  }
  .right-entry .v-popover.is-bottom {
    display: none!important;
  }
  `
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      action: 'set-title',
      payload: document.title,
    }),
  )
}

export const INJECTED_JAVASCRIPT = `(${__$hack})();true;`
