import React from 'react'
import { Linking, View } from 'react-native'
import { Text } from 'react-native'
import * as Application from 'expo-application'
import { StyleSheet } from 'react-native'
import { Button } from '@rneui/base'

const version = Application.nativeApplicationVersion
const githubLink = 'https://github.com/lovetingyuan/minibili'

export default function About() {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 40, color: '#fb7299', fontWeight: 'bold' }}>
        MiniBili
      </Text>
      <Text />
      <Text style={{ fontSize: 20 }}>一款简单的B站浏览app</Text>
      <Text />
      <Text style={{ fontSize: 16, color: '#555' }}>当前版本：{version}</Text>
      <Text />
      <Text style={{ marginTop: 30 }}>
        注：本应用所有数据均为B站官网公开，仅供学习交流
      </Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Button
          size="sm"
          type="clear"
          containerStyle={{ width: 100, marginTop: 20 }}
          onPress={() => {
            Linking.openURL(githubLink)
          }}>
          Github
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    marginHorizontal: 30,
  },
})
