import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useLivingInfo } from '../../api/living-info'
import { Avatar, Badge } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { Button } from '@rneui/themed'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import ButtonsOverlay from '../../components/ButtonsOverlay'
import store from '../../store'
import { FollowedUpItem } from '../../api/followed-ups'
import { useHasUpdate } from '../../api/dynamic-items'

export default React.memo(
  function FollowItem(props: { item: FollowedUpItem; width?: number }) {
    __DEV__ && console.log('follow item', props.item.name)
    const {
      item: { face, name, sign, mid },
    } = props
    const updateId = useHasUpdate(mid)
    store.updatedUps[mid] = !!updateId
    const navigation = useNavigation<NavigationProps['navigation']>()
    const liveInfo = useLivingInfo(mid)
    const [modalVisible, setModalVisible] = React.useState(false)
    const gotoDynamic = useMemoizedFn((clearUpdate?: boolean) => {
      store.dynamicUser = {
        mid,
        face,
        name,
        sign,
      }
      navigation.navigate('Dynamic', {
        from: 'followed',
      })
      if (clearUpdate) {
        store.$latestUpdateIds[mid] = updateId
        store.updatedUps[mid] = false
      }
    })
    const gotoLivePage = useMemoizedFn(() => {
      if (liveInfo?.liveUrl) {
        navigation.navigate('WebPage', {
          url: liveInfo.liveUrl,
          title: name + '的直播间',
        })
      }
    })
    const buttons = [
      updateId
        ? null
        : {
            text: '标记为未读',
            name: 'unread',
          },
    ].filter(Boolean)
    const handleOverlayClick = useMemoizedFn((n: string) => {
      if (n === 'unread') {
        store.$latestUpdateIds[mid] = Math.random() + ''
        store.updatedUps[mid] = true
        setModalVisible(false)
      }
    })
    return (
      <>
        <View style={[{ ...styles.container }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setModalVisible(true)}
            onPress={() => gotoDynamic(true)}>
            <Avatar
              size={50}
              rounded
              source={{ uri: face + '@120w_120h_1c.webp' }}
            />
          </TouchableOpacity>
          {updateId ? (
            <Badge key={updateId} badgeStyle={styles.updateMark} />
          ) : null}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setModalVisible(true)}
            onPress={() => gotoDynamic(false)}>
            <Text style={[styles.name]}>{name}</Text>
          </TouchableOpacity>
          {liveInfo?.living ? (
            <Button
              title="直播中~"
              type="clear"
              size="sm"
              containerStyle={{ marginLeft: 10 }}
              titleStyle={{ fontSize: 13 }}
              onPress={gotoLivePage}
            />
          ) : null}
        </View>
        <ButtonsOverlay
          buttons={buttons}
          onPress={handleOverlayClick}
          visible={modalVisible}
          dismiss={() => {
            setModalVisible(false)
          }}
        />
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
    marginVertical: 12,
    marginHorizontal: 10,
    flex: 1,
  },
  name: {
    fontSize: 14,
    marginTop: 8,
  },
  updateMark: {
    height: 14,
    width: 14,
    backgroundColor: '#fb7299',
    borderRadius: 14,
    position: 'absolute',
    top: -45,
    right: -30,
  },
  signText: { color: '#555', fontSize: 13 },
  liveText: { color: '#008AC5', fontSize: 14, marginLeft: 12, marginRight: 5 },
})
