import { File } from 'expo-file-system'
import { useState } from 'react'
import { TextInput, View } from 'react-native'

import { useSubmitFeedback } from '@/api/feedback'
import type { SelectedFeedbackImage } from '@/api/feedback.types'
import { Dialog } from '@/components/Dialog'
import { Image } from '@/components/styled/expo'
import { Button, Text } from '@/components/styled/rneui'
import { theme } from '@/constants/theme'
import { bilibiliSession } from '@/features/bilibili-session/session'
import { useBilibiliSessionState } from '@/features/bilibili-session/useBilibiliSession'
import { showToast } from '@/utils'
import {
  FEEDBACK_IMAGE_MIME_TYPES,
  FEEDBACK_MAX_IMAGE_BYTES,
  FEEDBACK_MAX_LENGTH,
} from '../../../../shared/feedback'
import type { FeedbackImageMimeType } from '../../../../shared/feedback'

import type { FeedbackDialogProps } from './feedback.types'

const MIME_BY_EXTENSION: Record<string, FeedbackImageMimeType> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function getImageMimeType(file: File): FeedbackImageMimeType | null {
  const normalizedType =
    file.type.toLowerCase() === 'image/jpg' ? 'image/jpeg' : file.type.toLowerCase()
  const matchingType = FEEDBACK_IMAGE_MIME_TYPES.find(mimeType => mimeType === normalizedType)
  return matchingType ?? MIME_BY_EXTENSION[file.extension.toLowerCase()] ?? null
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default function FeedbackDialog({ onClose }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState('')
  const [image, setImage] = useState<SelectedFeedbackImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const { account, control } = useBilibiliSessionState()
  const { submit, isSubmitting } = useSubmitFeedback()
  const characterCount = Array.from(feedback).length
  const canSubmit =
    Boolean(feedback.trim()) && characterCount <= FEEDBACK_MAX_LENGTH && !isSubmitting
  const currentAccount =
    control.phase === 'ready' && account && bilibiliSession.isCurrentAccount(account)
      ? account
      : null

  function close() {
    if (!isSubmitting) {
      onClose()
    }
  }

  async function pickImage() {
    setError(null)
    try {
      const result = await File.pickFileAsync({ mimeTypes: 'image/*' })
      if (result.canceled) {
        return
      }
      const mimeType = getImageMimeType(result.result)
      if (!mimeType) {
        setError('仅支持 JPEG、PNG、WebP 或 GIF 图片')
        return
      }
      if (result.result.size > FEEDBACK_MAX_IMAGE_BYTES) {
        setError('图片不能超过 5MB')
        return
      }
      setImage({ file: result.result, mimeType })
    } catch {
      setError('无法读取所选图片，请重新选择')
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return
    }
    setError(null)
    try {
      await submit({ feedback: feedback.trim(), biliId: currentAccount?.mid ?? null, image })
      showToast('反馈已发送，感谢你的意见')
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '反馈提交失败，请稍后重试')
    }
  }

  return (
    <Dialog visible onClose={isSubmitting ? undefined : close} dismissOnBackdrop={!isSubmitting}>
      <Dialog.Title title="您的意见很宝贵" />
      <TextInput
        value={feedback}
        autoFocus
        editable={!isSubmitting}
        multiline
        placeholder="请描述你的建议或遇到的问题*"
        textAlignVertical="top"
        accessibilityLabel="反馈内容"
        className={`min-h-24 max-h-36 rounded-lg border px-3 py-2 text-base ${inputFocused ? theme.primary.border : theme.border.outline} ${theme.text.primary}`}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        onChangeText={value => {
          setFeedback(Array.from(value).slice(0, FEEDBACK_MAX_LENGTH).join(''))
          setError(null)
        }}
      />

      <View className="mt-4 gap-2">
        <View className="flex-row items-center justify-between gap-2">
          <Text className={theme.text.primary}>问题截图（可选）</Text>
          {!image ? (
            <Button
              type="clear"
              size="sm"
              radius="md"
              disabled={isSubmitting}
              onPress={() => void pickImage()}
            >
              选择图片
            </Button>
          ) : null}
        </View>
        {image ? (
          <View
            className={`flex-row items-center gap-3 rounded-lg p-2 ${theme.background.fill.bg}`}
          >
            <Image
              source={{ uri: image.file.uri }}
              contentFit="cover"
              className="h-16 w-16 rounded-md"
              accessibilityLabel="已选择的反馈图片"
            />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className={`text-sm ${theme.text.primary}`}>
                {image.file.name}
              </Text>
              <Text className={`text-xs ${theme.text.muted}`}>
                {formatFileSize(image.file.size)}
              </Text>
            </View>
            <Button
              type="clear"
              size="sm"
              disabled={isSubmitting}
              titleClassName={theme.error.text}
              onPress={() => {
                setImage(null)
                setError(null)
              }}
            >
              移除
            </Button>
          </View>
        ) : (
          <Text className={`text-xs ${theme.text.muted}`}>支持 JPEG、PNG、WebP、GIF，最大 5MB</Text>
        )}
      </View>

      {error ? (
        <Text accessibilityRole="alert" className={`mt-3 text-sm ${theme.error.text}`}>
          {error}
        </Text>
      ) : null}

      <Dialog.Actions>
        <Dialog.Button
          title="提交"
          loading={isSubmitting}
          disabled={!canSubmit}
          onPress={() => void handleSubmit()}
        />
        <Dialog.Button
          title="取消"
          titleClassName={theme.text.muted}
          disabled={isSubmitting}
          onPress={close}
        />
      </Dialog.Actions>
    </Dialog>
  )
}
