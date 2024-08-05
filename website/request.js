export function advancedRequest(url, timeout, errorRetry) {
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
