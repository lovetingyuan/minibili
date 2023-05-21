import React from 'react'
import { Linking, Alert, ToastAndroid, Share, ScrollView } from 'react-native'
// import {  } from 'react-native'
import { StyleSheet } from 'react-native'
import * as Clipboard from 'expo-clipboard'

import store, { useStore } from '../../store'
import {
  Card,
  Chip,
  ListItem,
  Button,
  Icon,
  Text,
  useTheme,
} from '@rneui/themed'
import {
  checkUpdate as checkUpdateApi,
  currentVersion,
} from '../../api/check-update'
import { githubLink, site } from '../../constants'
import { NavigationProps } from '../../types'
import { useNavigation } from '@react-navigation/native'
import { Action, clearUser, reportUserAction } from '../../utils/report'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'

export default function About() {
  const { $userInfo, $blackTags, $blackUps } = useStore()
  const [expanded, setExpanded] = React.useState(false)
  const [expandedUp, setExpandedUp] = React.useState(false)
  const [expandedStatement, setExpandedStatement] = React.useState(true)
  const navigation = useNavigation<NavigationProps['navigation']>()
  const [checkingUpdate, setCheckingUpdate] = React.useState(false)
  const [hasUpdate, setHasUpdate] = React.useState<boolean | null>(null)
  const { theme } = useTheme()

  const handleLogOut = () => {
    Alert.alert('确定退出吗？', '', [
      {
        text: '取消',
      },
      {
        text: '确定',
        onPress: () => {
          reportUserAction(Action.LOGOUT, {
            mid: store.$userInfo?.mid,
            name: store.$userInfo?.name,
          })
          store.$userInfo = null
          store.updatedUps = {}
          store.dynamicUser = null
          store.$followedUps = []
          store.livingUps = {}
          store.$ignoredVersions = []
          clearUser()
          setTimeout(() => {
            navigation.navigate('Login')
          }, 100)
        },
      },
    ])
  }
  const checkUpdate = () => {
    if (checkingUpdate) {
      return
    }
    setCheckingUpdate(true)
    checkUpdateApi().then(
      data => {
        setHasUpdate(data.hasUpdate)
        if (data.hasUpdate) {
          Alert.alert(
            '有新版本',
            `${data.currentVersion} --> ${data.latestVersion}\n\n${data.changes
              .join('\n')
              .replace('[force]', '')}`,
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
        }
        setCheckingUpdate(false)
      },
      () => {
        ToastAndroid.show('检查更新失败', ToastAndroid.SHORT)
        setCheckingUpdate(false)
      },
    )
  }
  const handleShare = () => {
    Share.share({
      message: 'MiniBili - 简单的B站浏览\n点击下载：' + site,
    })
  }
  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.FeaturedTitle>
          <Text
            onPress={() => {
              Linking.openURL(site)
            }}
            style={styles.appName}>
            MiniBili{' '}
          </Text>
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
              color={theme.colors.grey1}
              onPress={() => {
                Linking.openURL(githubLink)
              }}
            />
          </ListItem>
        </Card.FeaturedSubtitle>
        <Card.Divider />

        <ListItem containerStyle={{ padding: 0, marginBottom: 5 }}>
          <ListItem.Content>
            <ListItem.Title
              right
              style={{ color: theme.colors.black }}
              onPress={() => {
                Alert.alert(
                  '版本信息',
                  [
                    `当前版本：${currentVersion} (${
                      Constants.expoConfig?.extra?.gitHash || '-'
                    })`,
                    `更新时间：${Updates.createdAt?.toLocaleDateString()} ${Updates.createdAt?.toLocaleTimeString()}`,
                    `版本频道：${Updates.channel} - ${Updates.runtimeVersion}`,
                    Updates.updateId && `更新ID: ${Updates.updateId}`,
                  ]
                    .filter(Boolean)
                    .join('\n'),
                )
              }}>
              当前版本：{currentVersion}
            </ListItem.Title>
          </ListItem.Content>
          <Button
            type="clear"
            size="sm"
            loading={checkingUpdate}
            onPress={() => {
              checkUpdate()
            }}>
            {hasUpdate === false ? '暂无更新' : '检查更新'}
          </Button>
        </ListItem>
        <ListItem containerStyle={{ padding: 0, marginBottom: 5 }}>
          <ListItem.Content>
            <ListItem.Title
              right
              style={{ color: theme.colors.black }}
              onPress={() => {
                $userInfo?.mid &&
                  Clipboard.setStringAsync($userInfo.mid + '').then(() => {
                    ToastAndroid.show('已复制uid', ToastAndroid.SHORT)
                  })
              }}>
              当前用户ID：{$userInfo?.mid}
            </ListItem.Title>
          </ListItem.Content>
          <Button type="clear" size="sm" onPress={handleLogOut}>
            退出
          </Button>
        </ListItem>
        <ListItem containerStyle={{ padding: 0, marginBottom: 5 }}>
          <ListItem.Content>
            <ListItem.Title right style={{ color: theme.colors.black }}>
              欢迎分享本应用 ❤
            </ListItem.Title>
          </ListItem.Content>
          <Button type="clear" size="sm" onPress={handleShare}>
            分享
          </Button>
        </ListItem>
        <ListItem.Accordion
          containerStyle={styles.blackTitle}
          content={
            <ListItem.Content>
              <ListItem.Title>声明</ListItem.Title>
            </ListItem.Content>
          }
          isExpanded={expandedStatement}
          onPress={() => {
            setExpandedStatement(!expandedStatement)
          }}>
          <ListItem containerStyle={styles.statementContent}>
            <ListItem.Subtitle right style={{ color: theme.colors.black }}>
              本应用完全开源并且所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!（有问题可在Github中提出）
            </ListItem.Subtitle>
          </ListItem>
        </ListItem.Accordion>
        <Card.Divider />
        <ListItem.Accordion
          containerStyle={styles.blackTitle}
          content={
            <ListItem.Content>
              <ListItem.Title>
                不感兴趣的分类（{Object.keys($blackTags).length}）
              </ListItem.Title>
            </ListItem.Content>
          }
          isExpanded={expanded}
          onPress={() => {
            setExpanded(!expanded)
          }}>
          <ListItem containerStyle={styles.blackContent}>
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
                  titleStyle={{ textAlign: 'left' }}
                  containerStyle={{ marginBottom: 7, alignSelf: 'flex-start' }}
                  buttonStyle={{
                    padding: 0,
                    paddingVertical: 2,
                  }}
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
              <ListItem.Title>
                不喜欢的UP（{Object.keys($blackUps).length}）
              </ListItem.Title>
            </ListItem.Content>
          }
          isExpanded={expandedUp}
          onPress={() => {
            setExpandedUp(!expandedUp)
          }}>
          <ListItem containerStyle={styles.blackContent}>
            {Object.values($blackUps).map(name => {
              return (
                <Text key={name} style={{ color: theme.colors.grey3 }}>
                  {name}
                </Text>
              )
            })}
            {Object.values($blackUps).length === 0 ? <Text>无</Text> : null}
          </ListItem>
        </ListItem.Accordion>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 15,
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
    marginTop: 5,
    marginBottom: 10,
  },
  blackContent: {
    flexWrap: 'wrap',
    padding: 0,
    paddingHorizontal: 5,
    // paddingBottom: 10,
    // paddingHorizontal: 10,
  },
  statementContent: {
    paddingVertical: 0,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  buildTime: {
    textAlign: 'right',
    fontSize: 12,
    color: '#888',
    marginTop: 20,
  },
})
