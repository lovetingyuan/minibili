import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
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
import store from '../../valtio/store'

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
    const gotoDynamic = useMemoizedFn((clearUpdate: any) => {
      store.dynamicUser = {
        mid,
        face,
        name,
        sign,
      }
      // setTimeout(() => {
      navigation.navigate('Dynamic')
      // }, 200);
      if (clearUpdate !== false) {
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
      updatedId
        ? {
            text: '查看动态',
            name: 'view',
          }
        : null,
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
      } else if (n === 'view') {
        gotoDynamic(false)
      }
    })
    return (
      <View style={{ opacity: loading ? 0.4 : 1 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => {
            setModalVisible(true)
          }}
          onPress={gotoDynamic}>
          <View style={styles.container}>
            <View>
              <Avatar
                size={52}
                containerStyle={{ marginRight: 16 }}
                rounded
                source={{ uri: face + (isTracy ? '' : '@120w_120h_1c.webp') }}
              />
              {updatedId ? (
                <Badge
                  status="success"
                  value=""
                  key={updatedId}
                  badgeStyle={styles.updateMark}
                />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameContainer}>
                <Text style={[styles.name, tracyStyle]}>{name}</Text>
                {isTracy ? (
                  <Image
                    source={require('../../assets/GC1.png')}
                    style={{ width: 18, height: 18, marginLeft: 8 }}
                  />
                ) : null}
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
            </View>
          </View>
        </TouchableOpacity>
        <ButtonsOverlay
          // @ts-ignore
          buttons={buttons}
          onPress={handleOverlayClick}
          visible={modalVisible}
          dismiss={() => {
            setModalVisible(false)
          }}
        />
      </View>
    )
  },
  (a, b) => {
    return a.item?.mid === b.item?.mid
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
  },
  face: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  nameContainer: { flexDirection: 'row', alignItems: 'center' },
  name: {
    fontSize: 16,
    // marginBottom: ,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    flexWrap: 'wrap',
  },
  updateMark: {
    height: 12,
    width: 12,
    backgroundColor: '#fb7299',
    borderRadius: 14,
    position: 'absolute',
    top: -48,
    left: 43,
  },
  signText: { color: '#555', marginTop: 2, fontSize: 13 },
  liveText: { color: '#008AC5', fontSize: 14, marginLeft: 12, marginRight: 5 },
  overlay: {
    padding: 16,
    backgroundColor: 'white',
    minWidth: 200,
  },
  overlayButton: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
})
