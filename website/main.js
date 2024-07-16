import './style.css'

import Alpine from 'alpinejs'

window.Alpine = Alpine

Alpine.data('appData', () => {
  return {
    latestVersion: '',
    latestApkUrl: '',
    changeLogs: [],
    leftIndex: 3,
    rightIndex: 1,
    screenShotCount: 4,
    showDownloadToast: false,
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
      fetch('https://unpkg.com/minibili/package.json?_t=' + Date.now())
        .then((r) => r.json())
        .then((r) => {
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
      fetch('https://www.unpkg.com/minibili')
        .then((r) => r.json())
        .then((list) => {
          this.changeLogs = list.map((change) => {
            const changelogs = change.changelog
            const buildDate = change.date.split('T')[0]
            const version = change.version
            return { version, changelogs, date: buildDate }
          })
        })
    },
  }
})

Alpine.start()
