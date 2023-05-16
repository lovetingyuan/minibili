import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Avatar, Badge } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { Button } from '@rneui/themed'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import ButtonsOverlay from '../../components/ButtonsOverlay'
import store, { useStore } from '../../store'
import { FollowedUpItem } from '../../api/followed-ups'
import { useHasUpdate } from '../../api/dynamic-items'
// import { useLivingInfo2 } from '../../api/living-info'

export default React.memo(
  function FollowItem(props: { item: FollowedUpItem; width?: number }) {
    // __DEV__ && console.log('follow item', props.item.name)
    const {
      item: { face, name, sign, mid },
    } = props
    const updateId = useHasUpdate(mid)

    React.useEffect(() => {
      if (updateId) {
        if (!store.updatedUps[mid]) {
          store.updatedUps[mid] = true
        }
      } else if (store.updatedUps[mid]) {
        store.updatedUps[mid] = false
      }
    }, [updateId, mid])
    // store.updatedUps[mid] = !!updateId
    const navigation = useNavigation<NavigationProps['navigation']>()
    const { livingUps } = useStore()
    // const { data: livingInfo } = useLivingInfo2(mid)
    // const livingInfo =
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
      const liveUrl = livingUps[mid]
      if (liveUrl) {
        navigation.navigate('WebPage', {
          url: liveUrl,
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
              size={45}
              rounded
              source={{ uri: face + '@120w_120h_1c.webp' }}
            />
          </TouchableOpacity>
          {updateId ? (
            <Badge key={updateId} badgeStyle={styles.updateMark} />
          ) : null}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ width: '100%' }}
            onLongPress={() => setModalVisible(true)}
            onPress={() => gotoDynamic(false)}>
            <Text style={[styles.name]} numberOfLines={2} ellipsizeMode="tail">
              {name}
            </Text>
          </TouchableOpacity>
          {livingUps[mid] ? (
            <Button
              title="直播中~"
              type="clear"
              size="sm"
              containerStyle={{
                position: 'relative',
                top: -5,
              }}
              titleStyle={{ fontSize: 14 }}
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
    // marginVertical: 12,
    // marginHorizontal: 10,
    marginBottom: 10,
    flex: 1,
  },
  name: {
    fontSize: 14,
    padding: 10,
    textAlign: 'center',
    // flex: 1,
    // flexGrow: 1,
    // width: '100%',
    // marginTop: 8,
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
