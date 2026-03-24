import type { SendOtpResult, VerifyOtpResult } from '@/api/auth'
import type { AuthFailureReason, AuthModalMode } from '@/features/user-sync/types'

export interface AuthModalProps {
  email: string | null
  failureReason: AuthFailureReason | null
  mode: AuthModalMode
  onClose: () => void
  onSendOtp: (email: string) => Promise<SendOtpResult>
  onVerifyOtp: (email: string, otp: string) => Promise<VerifyOtpResult>
  visible: boolean
}
