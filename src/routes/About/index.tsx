import React from 'react'
import {
  Linking,
  Alert,
  ToastAndroid,
  Share,
  ScrollView,
  View,
  Image,
} from 'react-native'
import { StyleSheet } from 'react-native'
import * as Clipboard from 'expo-clipboard'

import store, { useStore } from '../../store'
import {
  Chip,
  ListItem,
  Button,
  Icon,
  Text,
  useTheme,
  Divider,
} from '@rneui/themed'
import {
  checkUpdate as checkUpdateApi,
  currentVersion,
} from '../../api/check-update'
import { githubLink, site } from '../../constants'
import { RootStackParamList } from '../../types'
import { clearUser, reportUserLogout } from '../../utils/report'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

export default function About({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'About'>) {
  const { $userInfo, $blackTags, $blackUps, $ranksList } = useStore()
  const [expanded, setExpanded] = React.useState(false)
  const [expandedUp, setExpandedUp] = React.useState(false)
  const [expandedCate, setExpandedCate] = React.useState(false)
  const [expandedStatement, setExpandedStatement] = React.useState(true)
  const [checkingUpdate, setCheckingUpdate] = React.useState(false)
  const [hasUpdate, setHasUpdate] = React.useState<boolean | null>(null)
  const { theme } = useTheme()
  const [sortedRankList, setSortedRankList] = React.useState<
    { rid: number; label: string }[]
  >([])
  const [, ...initUnsortedRankList] = $ranksList
  const [unsortedRankList, setUnSortedRankList] =
    React.useState(initUnsortedRankList)

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
          store.updatedUps = {}
          // store.dynamicUser = null
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
      <View style={{ marginBottom: 10, flex: 1, alignItems: 'center' }}>
        <Image
          source={require('../../../assets/minibili.png')}
          style={{ width: 300, height: 90 }}
        />
      </View>
      <View style={styles.infoItem}>
        <Text style={{ fontSize: 24 }}>一款简单的B站浏览App</Text>
        <Icon
          name="github"
          type="material-community"
          size={20}
          color={theme.colors.grey1}
          onPress={() => {
            Linking.openURL(githubLink)
          }}
        />
      </View>
      <Divider style={{ marginBottom: 10 }} />
      <View style={styles.infoItem}>
        <Text
          style={{ fontSize: 16 }}
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
        </Text>
        <Button
          type="clear"
          size="sm"
          loading={checkingUpdate}
          onPress={() => {
            checkUpdate()
          }}>
          {hasUpdate === false ? '暂无更新' : '检查更新'}
        </Button>
      </View>
      <View style={styles.infoItem}>
        <Text
          style={{ fontSize: 16 }}
          onPress={() => {
            $userInfo?.mid &&
              Clipboard.setStringAsync($userInfo.mid + '').then(() => {
                ToastAndroid.show('已复制用户ID', ToastAndroid.SHORT)
              })
          }}>
          当前用户ID：{$userInfo?.mid}
        </Text>
        <Button type="clear" size="sm" onPress={handleLogOut}>
          退出
        </Button>
      </View>
      <View style={styles.infoItem}>
        <Text
          style={{ fontSize: 16 }}
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
          欢迎分享本应用 ❤
        </Text>
        <Button type="clear" size="sm" onPress={handleShare}>
          分享
        </Button>
      </View>

      <ListItem.Accordion
        containerStyle={[styles.blackTitle]}
        content={
          <ListItem.Content>
            <ListItem.Title style={{ fontWeight: 'bold' }}>声明</ListItem.Title>
          </ListItem.Content>
        }
        isExpanded={expandedStatement}
        onPress={() => {
          setExpandedStatement(!expandedStatement)
        }}>
        <ListItem containerStyle={[styles.statementContent]}>
          <ListItem.Subtitle right style={{ color: theme.colors.black }}>
            🔈本应用完全开源并且所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!（有问题欢迎在
            <Text
              style={{ color: theme.colors.primary }}
              onPress={() => {
                Linking.openURL(githubLink)
              }}>
              {' Github '}
            </Text>
            中提出 😀）
            <Text>{'\n'}⚠️ 切勿频繁刷新数据！🙏</Text>
          </ListItem.Subtitle>
        </ListItem>
      </ListItem.Accordion>
      <Divider style={{ marginBottom: 10 }} />
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
        <ListItem containerStyle={[styles.blackContent]}>
          {/* <View> */}
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
                containerStyle={{
                  marginBottom: 7,
                  alignSelf: 'flex-start',
                }}
                buttonStyle={{
                  padding: 0,
                  paddingVertical: 2,
                }}
              />
            )
          })}
          {/* </View> */}
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
        <ListItem containerStyle={[styles.blackContent, { marginBottom: 10 }]}>
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
      <ListItem.Accordion
        containerStyle={styles.blackTitle}
        content={
          <ListItem.Content>
            <ListItem.Title>调整分区顺序</ListItem.Title>
          </ListItem.Content>
        }
        isExpanded={expandedCate}
        onPress={() => {
          setExpandedCate(!expandedCate)
        }}>
        <ListItem containerStyle={styles.blackContent}>
          <View style={styles.sortedCates}>
            {sortedRankList.map(cate => {
              return (
                <Chip
                  title={cate.label}
                  key={cate.rid}
                  type="outline"
                  onPress={() => {
                    const a = sortedRankList.filter(v => v.rid !== cate.rid)
                    const b = unsortedRankList.concat(cate)
                    setSortedRankList(a)
                    setUnSortedRankList(b)
                    store.$ranksList = [$ranksList[0], ...a, ...b]
                  }}
                  containerStyle={{ marginBottom: 8 }}
                  buttonStyle={{
                    padding: 0,
                    paddingVertical: 2,
                  }}
                />
              )
            })}
            {sortedRankList.length === 0 && (
              <Text style={{ flex: 1, marginBottom: 5 }}>
                {' '}
                点击名称调整顺序
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              columnGap: 10,
              marginTop: 20,
            }}>
            {unsortedRankList.map(cate => {
              return (
                <Chip
                  title={cate.label}
                  key={cate.rid}
                  type="outline"
                  onPress={() => {
                    const a = sortedRankList.concat(cate)
                    const b = unsortedRankList.filter(v => v.rid !== cate.rid)
                    setSortedRankList(a)
                    setUnSortedRankList(b)
                    store.$ranksList = [$ranksList[0], ...a, ...b]
                  }}
                  containerStyle={{ marginBottom: 8 }}
                  buttonStyle={{
                    padding: 0,
                    paddingVertical: 2,
                  }}
                />
              )
            })}
          </View>
        </ListItem>
      </ListItem.Accordion>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    backgroundColor: 'transparent',
  },
  blackContent: {
    flexWrap: 'wrap',
    padding: 0,
    flexDirection: 'row',
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
    // paddingBottom: 10,
    // paddingHorizontal: 10,
  },
  statementContent: {
    paddingVertical: 0,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  buildTime: {
    textAlign: 'right',
    fontSize: 12,
    color: '#888',
    marginTop: 20,
  },
  sortedCates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 0.5,
    borderBottomColor: '#888',
    // marginBottom: ,
    flex: 1,
    flexGrow: 1,
    width: '100%',
    columnGap: 10,
  },
})
