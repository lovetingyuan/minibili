import { Switch as NativeSwitch } from 'react-native'
import useResolvedColor from '@/hooks/useResolvedColor'
import type { SwitchProps } from './Switch.types'

export function Switch({
  colorClassName,
  iosBackgroundColorClassName,
  trackColorOnClassName,
  trackColorOffClassName,
  thumbColor,
  ios_backgroundColor,
  trackColor,
  ...props
}: SwitchProps) {
  const resolvedColor = useResolvedColor(colorClassName)
  const resolvedIosBackgroundColor = useResolvedColor(iosBackgroundColorClassName)
  const resolvedTrackColorOn = useResolvedColor(trackColorOnClassName)
  const resolvedTrackColorOff = useResolvedColor(trackColorOffClassName)

  return (
    <NativeSwitch
      {...props}
      thumbColor={resolvedColor ?? thumbColor}
      ios_backgroundColor={resolvedIosBackgroundColor ?? ios_backgroundColor}
      trackColor={{
        false: resolvedTrackColorOff ?? trackColor?.false,
        true: resolvedTrackColorOn ?? trackColor?.true,
      }}
    />
  )
}
