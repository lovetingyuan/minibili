import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import {
  StyleSheet,
  View,
  Image,
  useWindowDimensions,
  Linking,
} from 'react-native'
import { RootStackParamList } from '../types'
import { Button, Text } from '@rneui/themed'
import { useStore } from '../store'
import { githubLink } from '../constants'

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>

export default React.memo(function Welcome({ navigation }: Props) {
  const { set$firstRun } = useStore()
  const { width } = useWindowDimensions()
  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <Image
          source={require('../../assets/minibili.png')}
          style={{ width: width * 0.8, height: 'auto', aspectRatio: 3.3 }}
        />
      </View>
      <View style={{ padding: 30, flex: 1 }}>
        <Text style={styles.header}>欢迎使用极简版B站 😊</Text>
        <Text style={styles.introduce}>
          这里没有推荐、没有算法、没有广告、没有乱七八糟的功能，只有简单地浏览。
        </Text>
        <Text style={styles.statement}>
          🔈本应用为个人兴趣作品并完全开源(
          <Text
            style={{ color: '#008AC5' }}
            onPress={() => {
              Linking.openURL(githubLink)
            }}>
            {'github'}
          </Text>
          )，所有数据均为B站官网公开，不会读取、存储、公开任何个人隐私数据，仅供学习交流!
        </Text>
        <Text style={{ color: '#888', fontSize: 16, marginTop: 20 }}>
          如果遇到闪退或报错请及时更新最新版本。
        </Text>
      </View>
      <Button
        size="lg"
        containerStyle={styles.btn}
        onPress={() => {
          set$firstRun(Date.now())
          navigation.replace('VideoList')
        }}>
        同意并开始使用
      </Button>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    paddingVertical: 40,
  },
  header: {
    fontSize: 28,
  },
  introduce: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 40,
    lineHeight: 30,
  },
  statement: {
    fontSize: 16,
  },
  btn: { marginHorizontal: 20, borderRadius: 8 },
})
