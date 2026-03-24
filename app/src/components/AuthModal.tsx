import React from 'react'
import { KeyboardAvoidingView, View } from 'react-native'

import type { AuthModalProps } from './AuthModal.types'
import Modal2 from './Modal2'
import { Button, Input, Text } from './styled/rneui'
import { normalizeAuthEmail, normalizeOtpInput } from '@/features/user-sync/helpers'
import { showToast } from '@/utils'

function getFailureReasonText(reason: AuthModalProps['failureReason']) {
  if (reason === 'expired') {
    return '登录已过期，请重新发送验证码。'
  }
  if (reason === 'invalid') {
    return '登录认证失败，请重新验证邮箱。'
  }
  if (reason === 'network') {
    return '当前无法连接服务器，你仍然可以继续使用本地数据。'
  }
  return ''
}

export default function AuthModal({
  email: initialEmail,
  failureReason,
  mode,
  onClose,
  onSendOtp,
  onVerifyOtp,
  visible,
}: AuthModalProps) {
  const [countdown, setCountdown] = React.useState(0)
  const [email, setEmail] = React.useState(initialEmail ?? '')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [otp, setOtp] = React.useState('')
  const [otpSent, setOtpSent] = React.useState(false)

  React.useEffect(() => {
    if (!visible) {
      return
    }

    setCountdown(0)
    setEmail(initialEmail ?? '')
    setError('')
    setLoading(false)
    setOtp('')
    setOtpSent(false)
  }, [initialEmail, visible])

  React.useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [countdown])

  const sendOtp = async () => {
    const targetEmail = normalizeAuthEmail(mode === 'reauth' ? initialEmail ?? '' : email)
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setError('请输入正确的邮箱地址')
      return
    }

    setLoading(true)
    setError('')
    const result = await onSendOtp(targetEmail)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? '发送验证码失败')
      if (result.waitSeconds) {
        setCountdown(result.waitSeconds)
      }
      return
    }

    setEmail(targetEmail)
    setOtpSent(true)
    setCountdown(result.resendAfterSeconds ?? 60)
    showToast('验证码已发送')
  }

  const verifyCode = async () => {
    const normalizedOtp = normalizeOtpInput(otp)
    if (normalizedOtp.length !== 6) {
      setError('请输入 6 位验证码')
      return
    }

    setLoading(true)
    setError('')
    const result = await onVerifyOtp(email, normalizedOtp)
    setLoading(false)

    if (!result.success) {
      setOtp('')
      setError(result.error ?? '验证码错误')
      return
    }

    showToast('登录成功')
    onClose()
  }

  return (
    <Modal2
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-center bg-black/45 px-5">
        <View className="rounded-3xl bg-white px-5 py-6 dark:bg-neutral-950">
          <View className="mb-5 gap-2">
            <Text className="text-xl font-semibold">{mode === 'reauth' ? '重新验证' : '邮箱登录'}</Text>
            <Text className="text-sm text-gray-500">
              {mode === 'reauth'
                ? getFailureReasonText(failureReason)
                : '登录后即可把关注、收藏、历史等本地数据同步到服务器。'}
            </Text>
          </View>

          <View className="gap-4">
            {mode === 'login' && !otpSent ? (
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                containerClassName="p-0"
                editable={!loading}
                inputClassName="px-1 text-base text-gray-900 dark:text-gray-50"
                inputContainerClassName="rounded-2xl border border-gray-300 px-3 py-1 dark:border-gray-700"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="请输入邮箱地址"
                placeholderTextColorClassName="accent-gray-400"
                value={email}
              />
            ) : (
              <View className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                <Text className="text-sm text-gray-500">验证码将发送到</Text>
                <Text className="mt-1 text-base font-medium">{email}</Text>
              </View>
            )}

            {otpSent ? (
              <>
                <Input
                  autoCapitalize="characters"
                  autoCorrect={false}
                  containerClassName="p-0"
                  editable={!loading}
                  inputClassName="px-1 text-base tracking-[0.35em] text-gray-900 dark:text-gray-50"
                  inputContainerClassName="rounded-2xl border border-gray-300 px-3 py-1 dark:border-gray-700"
                  onChangeText={value => {
                    setOtp(normalizeOtpInput(value))
                  }}
                  placeholder="请输入 6 位验证码"
                  placeholderTextColorClassName="accent-gray-400"
                  value={otp}
                />
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-gray-500">验证码 5 分钟内有效，最多尝试 5 次</Text>
                  <Button
                    buttonClassName="h-8 px-0"
                    disabled={countdown > 0 || loading}
                    onPress={() => {
                      void sendOtp()
                    }}
                    size="sm"
                    title={countdown > 0 ? `${countdown}s` : '重新发送'}
                    type="clear"
                  />
                </View>
              </>
            ) : null}

            {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

            <View className="mt-2 flex-row justify-end gap-3">
              <Button
                buttonClassName="rounded-2xl px-4"
                disabled={loading}
                onPress={onClose}
                size="sm"
                title="取消"
                type="clear"
              />
              {otpSent ? (
                <Button
                  buttonClassName="rounded-2xl px-4"
                  disabled={loading || normalizeOtpInput(otp).length !== 6}
                  loading={loading}
                  onPress={() => {
                    void verifyCode()
                  }}
                  size="sm"
                  title="验证"
                />
              ) : (
                <Button
                  buttonClassName="rounded-2xl px-4"
                  disabled={loading}
                  loading={loading}
                  onPress={() => {
                    void sendOtp()
                  }}
                  size="sm"
                  title="发送验证码"
                />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal2>
  )
}
