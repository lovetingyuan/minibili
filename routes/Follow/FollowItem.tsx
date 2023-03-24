import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { getFollowUps, getLiveStatus } from '../../services/Bilibili'
import { Avatar, Badge } from '@rneui/base'
import { checkDynamics, setLatest } from '../../services/Updates'
import { useNavigation } from '@react-navigation/native'
import { GetFuncPromiseType, RootStackParamList } from '../../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button } from '@rneui/base'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import ButtonsOverlay from '../../components/ButtonsOverlay'
import { useSnapshot } from 'valtio'
import store from '../../store'

const rejectHandler = (reason: any) => ({
  status: 'rejected' as const,
  reason,
})
const resolveHandler = (value: any) => ({
  status: 'fulfilled' as const,
  value,
})
function allSettled(promises: Promise<any>[]) {
  const convertedPromises = promises.map(p =>
    Promise.resolve(p).then(resolveHandler, rejectHandler),
  )
  return Promise.all(convertedPromises)
}

type UpItem = GetFuncPromiseType<typeof getFollowUps>['list'][0]
type NavigationProps = NativeStackScreenProps<RootStackParamList>

export default React.memo(
  function FollowItem(props: { item: UpItem }) {
    __DEV__ && console.log('follow item', props.item.name)
    const {
      item: { face, name, sign, mid },
    } = props
    const { specialUser } = useSnapshot(store)
    const tracyStyle: Record<string, any> = {}
    const isTracy = mid == specialUser?.mid
    if (isTracy) {
      tracyStyle.color = '#fb7299'
      tracyStyle.fontSize = 18
    }
    const [updatedId, setUpdatedId] = React.useState('')
    const [livingInfo, setLiving] = React.useState<{
      living: boolean
      liveUrl?: string
    } | null>(null)
    const navigation = useNavigation<NavigationProps['navigation']>()
    const [loading, setLoading] = React.useState(false)
    const updateData = React.useCallback(() => {
      return allSettled([
        updatedId ? Promise.resolve('') : checkDynamics(mid),
        getLiveStatus(mid),
      ]).then(([a, b]) => {
        if (a.status === 'fulfilled' && a.value) {
          setUpdatedId(a.value)
          store.updatedUps[mid] = true
        }
        if (b.status === 'fulfilled') {
          const { living, roomId } = b.value
          setLiving({
            living,
            liveUrl: 'https://live.bilibili.com/' + roomId,
          })
          store.livingUps[mid] = living
        }
        if (a.status === 'fulfilled' && b.status === 'fulfilled') {
          setLoading(false)
        }
      })
    }, [mid])
    React.useEffect(() => {
      if (loading) {
        return
      }
      setLoading(true)
      updateData()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mid])
    React.useEffect(() => {
      let updateTime = Math.random() * 5
      if (updateTime < 5) {
        updateTime += 5
      }
      if (updateTime > 8) {
        updateTime -= 2
      }
      const timer = setInterval(() => {
        updateData()
      }, updateTime * 60 * 1000)
      return () => {
        clearInterval(timer)
      }
    }, [updateData])

    const [modalVisible, setModalVisible] = React.useState(false)
    const gotoDynamic = useMemoizedFn((clearUpdate?: boolean) => {
      store.dynamicUser = {
        mid,
        face,
        name,
        sign,
      }
      // setTimeout(() => {
      navigation.navigate('Dynamic')
      // }, 200);
      if (clearUpdate) {
        setLatest(mid, updatedId + '')
        setUpdatedId('')
        store.updatedUps[mid] = false
      }
    })
    const gotoLivePage = useMemoizedFn(() => {
      if (livingInfo?.liveUrl) {
        navigation.navigate('WebPage', {
          url: livingInfo.liveUrl,
          title: name + '的直播间',
        })
      }
    })
    const buttons = [
      updatedId
        ? null
        : {
            text: '标记为未读',
            name: 'unread',
          },
      specialUser?.name === props.item.name
        ? {
            text: '取消特别关注',
            name: 'cancelSpecial',
          }
        : {
            text: `设置 ${props.item.name} 为特别关注 ❤`,
            name: 'special',
          },
    ].filter(Boolean)
    const handleOverlayClick = useMemoizedFn((n: string) => {
      if (n === 'unread') {
        const random = Math.random().toString().slice(2, 10)
        setLatest(mid, random)
        setUpdatedId(random)
        store.updatedUps[mid] = true
        setModalVisible(false)
      } else if (n === 'special') {
        store.specialUser = {
          name,
          mid: mid + '',
          face,
          sign,
        }
      } else if (n === 'cancelSpecial') {
        store.specialUser = null
      }
    })
    return (
      <>
        <View style={{ opacity: loading ? 0.4 : 1, ...styles.container }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => gotoDynamic(true)}>
            <Avatar
              size={55}
              containerStyle={{ marginRight: 15 }}
              rounded
              source={{ uri: face + (isTracy ? '' : '@120w_120h_1c.webp') }}
            />
            {updatedId ? (
              <Badge key={updatedId} badgeStyle={styles.updateMark} />
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setModalVisible(true)}
            style={styles.nameSignContainer}
            onPress={() => gotoDynamic(false)}>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, tracyStyle]}>{name}</Text>
              {/* {isTracy ? (
                <Image
                  source={require('../../assets/GC1.png')}
                  style={{ width: 18, height: 18, marginLeft: 8 }}
                />
              ) : null} */}
              {livingInfo?.living ? (
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
            {sign ? (
              <Text
                style={[
                  styles.signText,
                  isTracy ? { color: '#178bcf', fontSize: 14 } : null,
                ]}
                numberOfLines={2}>
                {sign}
              </Text>
            ) : null}
          </TouchableOpacity>
        </View>
        <ButtonsOverlay
          // @ts-ignore
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
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 15,
  },
  nameSignContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateMark: {
    height: 14,
    width: 14,
    backgroundColor: '#fb7299',
    borderRadius: 14,
    position: 'absolute',
    top: -50,
    left: 45,
  },
  signText: { color: '#555', fontSize: 13 },
  liveText: { color: '#008AC5', fontSize: 14, marginLeft: 12, marginRight: 5 },
})
