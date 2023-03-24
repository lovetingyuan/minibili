export const parseNumber = (num?: number) => {
  if (num == null) {
    return ''
  }
  if (num < 10000) {
    return num + ''
  }
  return (num / 10000).toFixed(1) + '万'
}

export const parseDate = (time?: number | string) => {
  if (!time) {
    return ''
  }
  if (typeof time === 'string') {
    if (/^\d+$/.test(time)) {
      time = +time
    } else {
      return time
    }
  }
  if (time.toString().length === 10) {
    time = time * 1000
  }
  const date = new Date(time)
  const currentYear = new Date().getFullYear()
  let year = date.getFullYear()
  if (year === currentYear) {
    year = 0
  }
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year ? year + '-' : ''}${month}-${day}`
}

export const parseDuration = (duration: number) => {
  if (duration >= 24 * 60 * 60) {
    return `约${Math.round(duration / 60 / 60)}小时`
  }
  const date = new Date(duration * 1000)
  const hour = date.getHours() - date.getTimezoneOffset() / -60
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return [hour, minutes, seconds].filter(Boolean).join(':')
}
