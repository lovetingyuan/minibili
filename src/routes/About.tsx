import React from 'react'
import { Linking, Pressable, View, Alert, ToastAndroid } from 'react-native'
import { Text } from 'react-native'
import { StyleSheet } from 'react-native'
import { useSnapshot } from 'valtio'
import store from '../store'
import { Card, Chip, ListItem, Button } from '@rneui/themed'
import { useCheckVersion } from '../hooks/useCheckVersion'
import { githubLink, site } from '../constants'
import { NavigationProps } from '../types'
import { useNavigation } from '@react-navigation/native'

export default function About() {
  const { $userInfo, $blackTags, $blackUps } = useSnapshot(store)
  const [expanded, setExpanded] = React.useState(false)
  const [expandedUp, setExpandedUp] = React.useState(false)
  const navigation = useNavigation<NavigationProps['navigation']>()

  const {
    data: { hasUpdate, downloadLink, latestVersion, currentVersion },
    error,
    isLoading,
    mutate,
  } = useCheckVersion()
  if (error) {
    ToastAndroid.show('检查更新失败', ToastAndroid.SHORT)
  }
  const handleLogOut = () => {
    Alert.alert('确定退出吗？', '', [
      {
        text: '取消',
      },
      {
        text: '确定',
        onPress: () => {
          store.$userInfo = null
          store.updatedUps = {}
          store.dynamicUser = null
          store.$followedUps = []
          navigation.goBack()
        },
      },
    ])
  }
  return (
    <View style={styles.container}>
      <Card>
        <Card.Title
          style={{
            alignSelf: 'flex-start',
          }}>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              Linking.openURL(site)
            }}>
            <Text style={styles.appName}>MiniBili </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#555',
                width: 200,
                alignSelf: 'flex-end',
                position: 'relative',
                top: -5,
              }}>
              当前版本：{currentVersion}
            </Text>
          </Pressable>
        </Card.Title>
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ fontSize: 16, color: '#555', marginRight: 20 }}>
            当前用户ID：{$userInfo?.mid}
          </Text>
          <Button type="clear" size="sm" onPress={handleLogOut}>
            退出
          </Button>
        </View>
        <Text style={{ marginTop: 20 }}>
          注：本应用所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!
        </Text>
        <View style={{ marginTop: 15 }}>
          <Button
            type="outline"
            loading={isLoading}
            onPress={() => {
              if (!error && !isLoading && hasUpdate && downloadLink) {
                Linking.openURL(downloadLink)
              } else {
                mutate()
              }
            }}>
            {isLoading
              ? '正在检查更新...'
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
    // textAlign: 'left',
    color: '#fb7299',
    alignSelf: 'flex-end',
    fontWeight: 'bold',
    // width: 300,
    // borderWidth: 1,
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
