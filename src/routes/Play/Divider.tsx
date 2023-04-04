import React from 'react'
import { Pressable, View, Text, ToastAndroid, StyleSheet } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Icon } from '@rneui/base'

export default function Divider(props: {
  bvid: string
  tag: string
  commentsCount: number
}) {
  return (
    <View style={styles.divider}>
      <Text style={{ color: '#666', fontSize: 12, marginRight: 12 }}>
        {props.commentsCount}条评论
      </Text>
      <View style={styles.dividerLine} />
      <Pressable
        onPress={() => {
          Clipboard.setStringAsync(props.bvid).then(() => {
            ToastAndroid.show('已复制', ToastAndroid.SHORT)
          })
        }}>
        <Text style={{ color: '#666', fontSize: 12, marginLeft: 12 }}>
          {props.bvid}
        </Text>
      </Pressable>
      <Icon type="entypo" name="dot-single" size={12} color="#666" />
      <Text style={{ color: '#666', fontSize: 12 }}>{props.tag}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    marginVertical: 18,
    alignItems: 'center',
  },
  dividerLine: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    flexGrow: 1,
  },
})
