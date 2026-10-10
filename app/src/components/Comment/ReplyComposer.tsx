import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import type { ComponentRef } from 'react'
import { ActivityIndicator, Keyboard, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useResolveClassNames } from 'uniwind'
import { ArrowUp } from 'lucide-react-native'

import { Text } from '@/components/Text'
import { ThemedIcon } from '@/components/ThemedIcon'
import { theme } from '@/constants/colors.tw'
import useResolvedColor from '@/hooks/useResolvedColor'

import type { ReplyComposerProps } from './reply-composer.types'

// BottomSheetTextInput 内部包了一层手势库的 TextInput，className 透传不可靠，改由类名解析成 style
const INPUT_CLASS_NAME =
  'max-h-28 min-h-11 flex-1 rounded-3xl bg-fill-raised px-4 py-2.5 text-[15px] text-heading'

export default function ReplyComposer(props: ReplyComposerProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null)
  const insets = useSafeAreaInsets()
  const inputStyle = useResolveClassNames(INPUT_CLASS_NAME)
  const placeholderColor = useResolvedColor(theme.text.muted)
  const selectionColor = useResolvedColor(theme.primary.accent)
  const count = [...draft].length
  const canSubmit = Boolean(draft.trim()) && !props.pending

  useEffect(() => {
    if (props.focusRequested) {
      inputRef.current?.focus()
    }
  }, [props.focusRequested, props.target.id])

  async function submit() {
    if (!draft.trim() || props.pending) {
      return
    }
    if (await props.onSubmit(draft)) {
      setDraft('')
      Keyboard.dismiss()
    }
  }

  return (
    <View
      className="border-t border-divider-subtle bg-surface px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {count ? (
        <View className="mb-1 flex-row items-center justify-between px-1">
          <Text className={`min-w-0 flex-1 text-xs ${theme.text.muted}`} numberOfLines={1}>
            回复 @{props.target.name}
          </Text>
          <Text
            className={`text-[11px] tabular-nums ${count === 1000 ? theme.warning.text : theme.text.muted}`}
          >
            {count}/1000
          </Text>
        </View>
      ) : null}
      <View className="flex-row items-end gap-2">
        <BottomSheetTextInput
          ref={inputRef}
          value={draft}
          multiline
          placeholder={`回复 @${props.target.name}`}
          placeholderTextColor={placeholderColor}
          selectionColor={selectionColor}
          style={inputStyle}
          accessibilityLabel={`回复 ${props.target.name}`}
          onChangeText={value => setDraft([...value].slice(0, 1000).join(''))}
          onSubmitEditing={() => void submit()}
        />
        <Pressable
          className={`h-11 w-11 items-center justify-center rounded-full ${canSubmit ? theme.primary.bg : theme.background.fillDisabled.bg}`}
          accessibilityRole="button"
          accessibilityLabel="发送回复"
          accessibilityState={{ disabled: !canSubmit, busy: props.pending }}
          disabled={!canSubmit}
          onPress={() => void submit()}
        >
          {props.pending ? (
            <ActivityIndicator size="small" colorClassName={theme.icon.disabled} />
          ) : (
            <ThemedIcon
              icon={ArrowUp}
              size={19}
              colorClassName={canSubmit ? theme.primary.content : theme.icon.disabled}
            />
          )}
        </Pressable>
      </View>
    </View>
  )
}
