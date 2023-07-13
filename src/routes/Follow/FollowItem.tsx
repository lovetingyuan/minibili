import React from 'react'
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Avatar, Badge, Text } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { Button } from '@rneui/themed'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import store, { useStore } from '../../store'
import { FollowedUpItem } from '../../api/followed-ups'
import { Image } from 'expo-image'
import { showToast } from '../../utils'
import commonStyles from '../../styles'

export default React.memo(
  function FollowItem(props: { item: FollowedUpItem; width?: number }) {
    // __DEV__ && console.log('follow item', props.item.name)
    const {
      item: { face, name, sign, mid },
    } = props
    const { $upUpdateMap, livingUps } = useStore()
    let hasUpdate = false
    if ($upUpdateMap[mid]) {
      const { latestId, currentLatestId } = $upUpdateMap[mid]
      hasUpdate = latestId !== currentLatestId
    }
    const navigation = useNavigation<NavigationProps['navigation']>()
    const gotoDynamic = useMemoizedFn((clearUpdate?: boolean) => {
      navigation.navigate('Dynamic', {
        user: {
          mid,
          face,
          name,
          sign,
        },
      })
      if (clearUpdate && mid in store.$upUpdateMap) {
        store.$upUpdateMap[mid].latestId =
          store.$upUpdateMap[mid].currentLatestId
      }
    })
    const gotoLivePage = useMemoizedFn(() => {
      const liveUrl = livingUps[mid]
      if (liveUrl) {
        navigation.navigate('WebPage', {
          url: liveUrl,
          title: name + '的直播间',
        })
      }
    })
    const buttons = [
      hasUpdate
        ? {
            text: '标记为已读',
            onPress: () => {
              store.$upUpdateMap[mid].latestId =
                store.$upUpdateMap[mid].currentLatestId
            },
          }
        : {
            text: '标记为未读',
            onPress: () => {
              if (mid in store.$upUpdateMap) {
                store.$upUpdateMap[mid].latestId = Math.random().toString()
              } else {
                showToast('请稍候再操作')
              }
            },
          },
      {
        text: '取消关注',
        onPress: () => {
          Alert.alert('确定取消关注吗？', '', [
            {
              text: '确定',
              onPress() {
                store.$followedUps = store.$followedUps.filter(
                  up => up.mid !== mid,
                )
              },
            },
            { text: '关闭' },
          ])
        },
      },
    ]

    return (
      <>
        <View style={styles.container}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => {
                store.overlayButtons = buttons
              }}
              onPress={() => gotoDynamic(true)}>
              <Avatar
                size={45}
                rounded
                ImageComponent={Image}
                source={{ uri: face + '@120w_120h_1c.webp' }}
              />
            </TouchableOpacity>
            {hasUpdate ? (
              <Badge key={mid} badgeStyle={styles.updateMark} />
            ) : null}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{ width: '100%' }}
              onLongPress={() => {
                store.overlayButtons = buttons
              }}
              onPress={() => gotoDynamic(false)}>
              <Text
                style={[styles.name]}
                numberOfLines={2}
                ellipsizeMode="tail">
                {name}
              </Text>
            </TouchableOpacity>
          </View>
          {livingUps[mid] ? (
            <Button
              title="直播中~"
              type="clear"
              size="sm"
              containerStyle={{
                position: 'relative',
                top: -5,
              }}
              titleStyle={commonStyles.font14}
              onPress={gotoLivePage}
            />
          ) : null}
        </View>
      </>
    )
  },
  (a, b) => {
    return a.item?.mid === b.item?.mid
  },
)

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    padding: 10,
    textAlign: 'center',
    flex: 1,
  },
  updateMark: {
    height: 14,
    width: 14,
    backgroundColor: '#fb7299',
    borderRadius: 14,
    position: 'absolute',
    top: -40,
    right: -30,
  },
  liveText: { color: '#008AC5', fontSize: 14, marginLeft: 12, marginRight: 5 },
})
