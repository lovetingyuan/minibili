import React from 'react'
import { View, Alert, StyleSheet } from 'react-native'
import { Text, Button } from '@rneui/themed'
import store, { useStore } from '../../store'
import { showToast } from '../../utils'
import * as Clipboard from 'expo-clipboard'
import { clearUser, reportUserLogout } from '../../utils/report'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

export default React.memo(function User() {
  const { $userInfo } = useStore()
  const navigation = useNavigation<NavigationProps['navigation']>()

  const handleLogOut = () => {
    Alert.alert('确定退出吗？', '', [
      {
        text: '取消',
      },
      {
        text: '确定',
        onPress: () => {
          reportUserLogout()
          store.$userInfo = null
          store.$followedUps = []
          store.$ignoredVersions = []
          clearUser()
          setTimeout(() => {
            navigation.navigate('Login')
          }, 100)
        },
      },
    ])
  }
  return (
    <View style={styles.infoItem}>
      <Text
        style={styles.text}
        onPress={() => {
          $userInfo?.mid &&
            Clipboard.setStringAsync($userInfo.mid + '').then(() => {
              showToast('已复制用户ID')
            })
        }}>
        当前用户ID：{$userInfo?.mid}
      </Text>
      <Button type="clear" size="sm" onPress={handleLogOut}>
        退出
      </Button>
    </View>
  )
})

const styles = StyleSheet.create({
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  text: { fontSize: 16 },
})
