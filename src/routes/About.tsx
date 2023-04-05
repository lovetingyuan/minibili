import React from 'react'
import { Linking, View } from 'react-native'
import { Text } from 'react-native'
import * as Application from 'expo-application'
import { StyleSheet } from 'react-native'
import { useSnapshot } from 'valtio'
import store from '../store'
import { Card, Chip, ListItem, Button } from '@rneui/base'
import useSWR from 'swr'

const version = Application.nativeApplicationVersion
const githubLink = 'https://github.com/lovetingyuan/minibili'
const site = 'https://lovetingyuan.github.io/minibili/'
const changelogUrl = site + 'changelog.json'

export default function About() {
  const { $userInfo, $blackTags, $blackUps } = useSnapshot(store)
  const [expanded, setExpanded] = React.useState(false)
  const [expandedUp, setExpandedUp] = React.useState(false)
  const {
    data: changelog,
    mutate,
    isLoading,
    error,
  } = useSWR<{
    downloadLink: string
    changelog: { version: string; changes: string[] }[]
  }>(changelogUrl, url => {
    return fetch(url).then(r => r.json())
  })
  const latestVersion = changelog?.changelog[0].version
  const hasUpdate = latestVersion !== version
  const downloadLink = changelog?.downloadLink
  return (
    <View style={styles.container}>
      <Card>
        <Card.Title style={styles.appName}>MiniBili</Card.Title>
        <Card.Divider />
        <View style={styles.desc}>
          <Text style={{ fontSize: 20 }}>一款简单的B站浏览app</Text>
          <Button
            size="sm"
            type="clear"
            onPress={() => {
              Linking.openURL(githubLink)
            }}>
            Github
          </Button>
        </View>
        <Text />
        <Text style={{ fontSize: 16, color: '#555' }}>
          当前版本：{version} {'    '}当前用户ID：{$userInfo?.mid}
        </Text>
        <Text style={{ marginTop: 20 }}>
          注：本应用所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!
        </Text>
        <View style={{ marginTop: 10 }}>
          <Button
            onPress={() => {
              if (!error && !isLoading && hasUpdate && downloadLink) {
                Linking.openURL(downloadLink)
              } else {
                mutate()
              }
            }}>
            {error
              ? '检查更新失败'
              : isLoading
              ? '正在检查更新'
              : hasUpdate
              ? `有新版本${latestVersion}，点击下载`
              : '检查更新'}
          </Button>
        </View>
        <ListItem.Accordion
          containerStyle={styles.blackTitle}
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
                  key={tag}
                  type="outline"
                  icon={{
                    name: 'close',
                    type: 'Ionicons',
                    size: 18,
                    color: '#666',
                    onPress: () => {
                      delete store.$blackTags[tag]
                    },
                  }}
                  iconRight
                  containerStyle={{ marginBottom: 7 }}
                  buttonStyle={{ padding: 2, paddingStart: 0 }}
                />
              )
            })}
            {Object.values($blackTags).length === 0 ? <Text>无</Text> : null}
          </ListItem>
        </ListItem.Accordion>
        <ListItem.Accordion
          containerStyle={styles.blackTitle}
          content={
            <ListItem.Content>
              <ListItem.Title>不再看的up</ListItem.Title>
            </ListItem.Content>
          }
          isExpanded={expandedUp}
          onPress={() => {
            setExpandedUp(!expandedUp)
          }}>
          <ListItem
            containerStyle={{
              flexWrap: 'wrap',
            }}>
            {Object.values($blackUps).map(name => {
              return <Text key={name}>{name}</Text>
            })}
            {Object.values($blackUps).length === 0 ? <Text>无</Text> : null}
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
  desc: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  blackTitle: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 15,
    marginBottom: 0,
  },
})
