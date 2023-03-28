import React from 'react'
import { Linking, View } from 'react-native'
import { Text } from 'react-native'
import * as Application from 'expo-application'
import { StyleSheet, Pressable } from 'react-native'
import { useSnapshot } from 'valtio'
import store from '../store'
import { Card, Chip, ListItem } from '@rneui/base'

const version = Application.nativeApplicationVersion
const githubLink = 'https://github.com/lovetingyuan/minibili'

export default function About() {
  const { $userInfo, $blackTags } = useSnapshot(store)
  const [expanded, setExpanded] = React.useState(false)
  return (
    <View style={styles.container}>
      <Card>
        <Card.Title style={styles.appName}>MiniBili</Card.Title>
        <Card.Divider />
        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
          <Text style={{ fontSize: 20 }}>一款简单的B站浏览app</Text>
          <Pressable
            onPress={() => {
              Linking.openURL(githubLink)
            }}>
            <Text style={{ color: 'blue', marginTop: 5, textAlign: 'right' }}>
              Github
            </Text>
          </Pressable>
        </View>
        <Text />
        <Text style={{ fontSize: 16, color: '#555' }}>
          当前版本：{version} {'    '}当前用户ID：{$userInfo?.mid}
        </Text>
        <Text style={{ marginTop: 20 }}>
          注：本应用所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!
        </Text>

        <ListItem.Accordion
          containerStyle={{
            paddingVertical: 5,
            paddingHorizontal: 10,
            marginTop: 20,
          }}
          content={
            <ListItem.Content>
              <ListItem.Title>不感兴趣的分类</ListItem.Title>
            </ListItem.Content>
          }
          isExpanded={expanded}
          onPress={() => {
            setExpanded(!expanded)
          }}>
          <ListItem
            containerStyle={{
              flexWrap: 'wrap',
            }}>
            {Object.values($blackTags).map(tag => {
              return (
                <Chip
                  title={tag}
                  type="outline"
                  icon={{
                    name: 'close',
                    type: 'Ionicons',
                    size: 16,
                    color: '#666',
                    onPress: () => {
                      delete store.$blackTags[tag]
                    },
                  }}
                  iconRight
                  containerStyle={{ marginVertical: 15 }}
                  buttonStyle={{ padding: 3 }}
                />
              )
            })}
            {Object.values($blackTags).length === 0 ? <Text>无</Text> : null}
          </ListItem>
        </ListItem.Accordion>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appName: {
    fontSize: 40,
    textAlign: 'left',
    color: '#fb7299',
    fontWeight: 'bold',
  },
})
