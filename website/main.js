import './style.css'

import Alpine from 'alpinejs'

window.Alpine = Alpine

function advancedRequest(url, timeout, errorRetry) {
  return new Promise((resolve, reject) => {
    let retryCount = 0

    function makeRequest() {
      const controller = new AbortController()
      const signal = controller.signal

      const timeoutId = setTimeout(() => {
        controller.abort()
        handleError(new Error('Request timed out'))
      }, timeout)

      fetch(url, { signal })
        .then((response) => response.json())
        .then((data) => {
          clearTimeout(timeoutId)
          // if (data.code === -1) {
          //   throw new Error('Request failed with code -1')
          // }
          resolve(data)
        })
        .catch(handleError)

      function handleError(error) {
        clearTimeout(timeoutId)
        if (retryCount < errorRetry) {
          retryCount++
          // console.log(`Retrying request (${retryCount}/${errorRetry})...`)
          makeRequest()
        } else {
          reject(error)
        }
      }
    }

    makeRequest()
  })
}

Alpine.data('appData', () => {
  return {
    latestVersion: '',
    latestApkUrl: '',
    changeLogs: [],
    leftIndex: 3,
    rightIndex: 1,
    screenShotCount: 4,
    showDownloadToast: false,
    // eslint-disable-next-line no-undef
    buildTime: __BUILD_TIME__,
    displayDownloadToast() {
      if (this.latestApkUrl) {
        this.showDownloadToast = true
      }
    },
    handleHashChange() {
      // 0 1 2 3
      if (!window.location.hash) {
        return
      }
      const index = window.location.hash.split('-').pop() - 0
      this.leftIndex = (index + this.screenShotCount - 1) % this.screenShotCount
      this.rightIndex = (index + 1) % this.screenShotCount
    },
    init() {
      // Register an event handler that references the component instance
      this.handleHashChange = this.handleHashChange.bind(this)
      window.addEventListener('hashchange', this.handleHashChange)
      if (window.location.hash) {
        this.handleHashChange()
      }
    },
    destroy() {
      window.removeEventListener('hashchange', this.handleHashChange)
    },
    getLatestVersion() {
      if (this.latestVersion) {
        return
      }
      advancedRequest(
        'https://unpkg.com/minibili/package.json?_t=' + Date.now(),
        20 * 1000,
        5,
      ).then((r) => {
        const version = r.version.split('-')[0]
        const apkUrl = `https://unpkg.com/minibili@${r.version}/apk/minibili-${version}.apk`
        this.latestApkUrl = apkUrl
        this.latestVersion = version
      })
    },
    getChangelogs() {
      if (this.changeLogs.length) {
        return
      }
      advancedRequest('https://www.unpkg.com/minibili', 30 * 1000, 3).then(
        (list) => {
          this.changeLogs = list.map((change) => {
            const changelogs = change.changelog
            const buildDate = change.date.split('T')[0]
            const version = change.version
            return { version, changelogs, date: buildDate }
          })
        },
      )
    },
  }
})

Alpine.start()
