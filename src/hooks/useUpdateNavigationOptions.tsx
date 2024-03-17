import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import React from 'react'

import type { NavigationProps } from '@/types'

export default function useUpdateNavigationOptions(
  options: Partial<NativeStackNavigationOptions>,
) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  React.useEffect(() => {
    navigation.setOptions(options)
  }, [navigation, options])
}
