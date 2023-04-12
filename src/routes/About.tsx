import React from 'react'
import {
  Linking,
  Pressable,
  View,
  Alert,
  ToastAndroid,
  Share,
} from 'react-native'
import { Text } from 'react-native'
import { StyleSheet } from 'react-native'
import { useSnapshot } from 'valtio'
import store from '../store'
import { Card, Chip, ListItem, Button, Icon } from '@rneui/themed'
import {
  checkUpdate as checkUpdateApi,
  currentVersion,
} from '../api/checkAppUpdate'
import { githubLink, site } from '../constants'
import { NavigationProps } from '../types'
import { useNavigation } from '@react-navigation/native'

export default function About() {
  const { $userInfo, $blackTags, $blackUps } = useSnapshot(store)
  const [expanded, setExpanded] = React.useState(false)
  const [expandedUp, setExpandedUp] = React.useState(false)
  const navigation = useNavigation<NavigationProps['navigation']>()

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
          store.livingUps = {}
          store.$ignoredVersions = []
          navigation.goBack()
        },
      },
    ])
  }
  const checkUpdate = () => {
    ToastAndroid.show('请稍后...', ToastAndroid.SHORT)
    checkUpdateApi().then(data => {
      if (data.hasUpdate) {
        Alert.alert(
          '有新版本',
          `${data.currentVersion} --> ${
            data.latestVersion
          }\n\n${data.changes.join('\n')}`,
          [
            {
              text: '取消',
            },
            {
              text: '下载更新',
              onPress: () => {
                Linking.openURL(data.downloadLink!)
              },
            },
          ],
        )
      } else {
        ToastAndroid.show('暂无更新', ToastAndroid.SHORT)
      }
    })
  }
  const handleShare = () => {
    Share.share({
      message: 'MiniBili - 简单的B站浏览\n点击下载：' + site,
    })
  }
  return (
    <View style={styles.container}>
      <Card>
        <Card.FeaturedTitle>
          <Pressable
            onPress={() => {
              Linking.openURL(site)
            }}>
            <Text style={styles.appName}>MiniBili </Text>
          </Pressable>
        </Card.FeaturedTitle>
        <Card.FeaturedSubtitle style={{ borderWidth: 0 }}>
          <ListItem
            containerStyle={{
              padding: 0,
              paddingBottom: 10,
            }}>
            <ListItem.Content>
              <ListItem.Title style={{ fontSize: 18 }}>
                一款简单的B站浏览App
              </ListItem.Title>
            </ListItem.Content>
            <Icon
              name="github"
              type="material-community"
              size={20}
              color="#555"
              onPress={() => {
                Linking.openURL(githubLink)
              }}></Icon>
          </ListItem>
        </Card.FeaturedSubtitle>
        <Card.Divider />

        <ListItem containerStyle={{ padding: 0 }}>
          <ListItem.Content>
            <ListItem.Title right>当前版本：{currentVersion}</ListItem.Title>
          </ListItem.Content>
          <Button
            type="clear"
            size="sm"
            onPress={() => {
              checkUpdate()
            }}>
            检查更新
          </Button>
        </ListItem>
        <ListItem containerStyle={{ padding: 0 }}>
          <ListItem.Content>
            <ListItem.Title right>当前用户ID：{$userInfo?.mid}</ListItem.Title>
          </ListItem.Content>
          <Button type="clear" size="sm" onPress={handleLogOut}>
            退出
          </Button>
        </ListItem>
        <ListItem containerStyle={{ padding: 0 }}>
          <ListItem.Content>
            <ListItem.Title right>欢迎分享本应用 ❤</ListItem.Title>
          </ListItem.Content>
          <Button type="clear" size="sm" onPress={handleShare}>
            分享
          </Button>
        </ListItem>
        <ListItem containerStyle={{ padding: 0, marginTop: 20 }}>
          <ListItem.Content>
            <ListItem.Title>声明：</ListItem.Title>
            <ListItem.Subtitle right style={{ paddingLeft: 10, paddingTop: 5 }}>
              本应用所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  itemText: {
    fontSize: 16,
  },
  appName: {
    fontSize: 40,
    color: '#fb7299',
    alignSelf: 'flex-end',
    fontWeight: 'bold',
    flexShrink: 0,
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
