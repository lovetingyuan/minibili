import { onMounted, onActivated, onDeactivated, nextTick, Ref } from 'vue'

export default function usePlayerSizeChange(playerContainer: Ref<HTMLElement | null>, infoContainer: Ref<HTMLElement | null>) {

  let initPlayerHeight = 0
  const maxHeight = screen.height * 0.8;
  const getDomHeight = (dom: HTMLElement) => {
    return parseFloat(getComputedStyle(dom).height)
  }

  onMounted(() => {
    initPlayerHeight = getDomHeight(playerContainer.value as HTMLElement)
  })
  let startY: number, moveY: number, startHeight = initPlayerHeight
  function onTouch(e: TouchEvent) {
    if (!playerContainer.value || !infoContainer.value) return
    if (e.type === 'touchstart') {
      startHeight = getDomHeight(playerContainer.value)
      if (infoContainer.value.scrollTop === 0) {
        startY = e.touches[0].pageY
        if (startHeight > initPlayerHeight + 1) {
          infoContainer.value.style.overflowY = 'hidden'
        }
      } else {
        startY = -1
      }
    } else {
      const isTop = infoContainer.value.scrollTop === 0
      if (isTop && startY === -1) {
        startY = e.touches[0].pageY
      }
      moveY = e.touches[0].pageY - startY
      const height = (moveY + startHeight)
      if ((height > initPlayerHeight && height < maxHeight) && isTop) {
        requestAnimationFrame(() => {
          if (playerContainer.value) {
            if (Math.abs(height - initPlayerHeight) < 10) {
              playerContainer.value.style.height = initPlayerHeight + 'px'
            } else {
              playerContainer.value.style.height = height + 'px'
            }
          }
        })
        infoContainer.value.style.overflowY = 'hidden'
      } else {
        // playerContainer.value.style.height = initPlayerHeight + 'px'
        infoContainer.value.style.overflowY = 'auto'
      }
    }
  }

  onActivated(() => {
    nextTick(() => {
      if (playerContainer.value && infoContainer.value) {
        playerContainer.value.style.height = initPlayerHeight + 'px'
        infoContainer.value.style.overflowY = 'auto'
        infoContainer.value.scrollTop = 0;
      }
    })
    window.addEventListener('touchstart', onTouch)
    window.addEventListener('touchmove', onTouch)
  })

  onDeactivated(() => {
    window.removeEventListener('touchstart', onTouch)
    window.removeEventListener('touchmove', onTouch)
  })
}
