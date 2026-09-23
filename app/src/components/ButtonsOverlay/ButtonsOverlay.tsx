import { Button } from '@/components/styled/rneui'
import { Modal, Pressable, View } from 'react-native'
import { theme } from "@/constants/theme";
import { useStore } from '@/store'

function ButtonsOverlay() {
  const { overlayButtons, setOverlayButtons } = useStore()
  const dismiss = () => {
    setOverlayButtons([])
  }
  const Buttons = overlayButtons
    .map(button => {
      if (!button) {
        return null
      }
      return (
        <Button
          type="clear"
          buttonClassName="w-full justify-start px-5 py-2.5"
          titleClassName="w-full text-left"
          title={button.text}
          key={button.text}
          onPress={() => {
            dismiss()
            button.onPress()
          }}
        />
      )
    })
    .filter(Boolean)

  if (!Buttons.length) {
    return null
  }
  return (
    <Modal
      visible={overlayButtons.length > 0}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View className="flex-1 items-center justify-center">
        <Pressable
          className="absolute inset-0 bg-black/40"
          accessibilityLabel="关闭菜单"
          accessibilityRole="button"
          onPress={dismiss}
        />
        <View
          className={`w-[80%] max-w-[500px] overflow-hidden rounded-lg px-0 py-3 shadow-sm ${theme.background.fillStrong.bg}`}
        >
          {Buttons}
        </View>
      </View>
    </Modal>
  )
}

export default ButtonsOverlay
