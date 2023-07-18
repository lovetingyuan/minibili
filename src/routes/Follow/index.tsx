import React from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native'
import { Text, Icon } from '@rneui/themed'
import FollowItem from './FollowItem'
import { RootStackParamList, UpInfo } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { useStore } from '../../store'
import { checkUpdateUps } from '../../api/dynamic-items'
import commonStyles from '../../styles'
import AddFollow from './AddFollow'
import { FAB } from '@rneui/themed'
import { showToast } from '../../utils'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>

const renderItem = ({
  item,
}: // index,
{
  item: UpInfo | null
  index: number
}) => {
  if (item) {
    return <FollowItem item={item} />
  }
  return <View style={commonStyles.flex1} />
}

let firstRender = true

export default React.memo(function Follow({ navigation }: Props) {
  // eslint-disable-next-line no-console
  __DEV__ && console.log('Follow page')
  const {
    $followedUps,
    $upUpdateMap,
    livingUps,
    checkingUpUpdate,
    updatedCount,
  } = useStore()
  const followListRef = React.useRef<FlatList | null>(null)
  const [showAddUp, setShowAddUp] = React.useState(0)

  React.useEffect(() => {
    if (firstRender) {
      checkUpdateUps(true)
      firstRender = false
      window.setInterval(() => {
        checkUpdateUps(false)
      }, 10 * 60 * 1000)
    }
  }, [])
  React.useEffect(() => {
    const count = $followedUps.length
    navigation.setOptions({
      headerTitle: () => {
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              我的关注
              {count
                ? updatedCount
                  ? `(${updatedCount}/${count})`
                  : `(${count})`
                : ''}
            </Text>
            {checkingUpUpdate ? (
              <ActivityIndicator
                size={'small'}
                color={'#F85A54'}
                style={{ marginLeft: 10 }}
              />
            ) : null}
          </View>
        )
      },
      headerRight: () => {
        return (
          <Icon
            name="snow"
            type="ionicon"
            size={20}
            color="#00AEEC"
            style={{ padding: 8 }}
            onPress={() => {
              navigation.navigate('About')
            }}
          />
        )
      },
    })
  }, [navigation, $followedUps, checkingUpUpdate, updatedCount])

  const { width } = useWindowDimensions()

  React.useEffect(() => {
    return navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return
      }
      try {
        followListRef.current?.scrollToOffset({
          offset: 0,
        })
      } catch (err) {}
    })
  }, [navigation])

  const columns = Math.floor(width / 90)
  const followedUpListLen = $followedUps.length
  const rest = followedUpListLen
    ? columns - (followedUpListLen ? followedUpListLen % columns : 0)
    : 0

  let displayUps: (UpInfo | null)[] = []
  const topUps: UpInfo[] = []
  const updateUps: UpInfo[] = []
  const otherUps: UpInfo[] = []
  const updatedUps: Record<string, boolean> = {}
  for (const mid in $upUpdateMap) {
    updatedUps[mid] =
      $upUpdateMap[mid].latestId !== $upUpdateMap[mid].currentLatestId
  }
  for (const up of $followedUps) {
    if (livingUps[up.mid]) {
      topUps.push({ ...up })
    } else if (updatedUps[up.mid]) {
      updateUps.push({ ...up })
    } else {
      otherUps.push({ ...up })
    }
  }
  displayUps = [
    ...topUps,
    ...updateUps,
    ...otherUps,
    ...(rest ? Array.from({ length: rest }).map(() => null) : []),
  ]

  const emptyContent = () => {
    return <Text style={styles.emptyText}>暂无关注，请添加</Text>
  }

  return (
    <View style={styles.container}>
      <View style={commonStyles.flex1}>
        <FlatList
          data={displayUps}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item ? item.mid + '' : index + '')}
          onEndReachedThreshold={1}
          persistentScrollbar
          key={columns} // FlatList不支持直接更改columns
          numColumns={columns}
          ref={followListRef}
          columnWrapperStyle={{
            paddingHorizontal: 10,
          }}
          contentContainerStyle={{
            paddingTop: 30,
          }}
          ListEmptyComponent={emptyContent()}
          ListFooterComponent={
            $followedUps.length ? (
              <Text style={styles.bottomText}>到底了~</Text>
            ) : null
          }
        />
      </View>
      <FAB
        visible
        color="#f25d8e"
        placement="right"
        icon={{ name: 'add', color: 'white' }}
        style={{ bottom: 10, opacity: 0.8 }}
        size="small"
        onPress={() => {
          if ($followedUps.length > 200) {
            showToast('暂时只支持最多200个关注')
            return
          }
          setShowAddUp(s => s + 1)
        }}
      />
      <AddFollow show={showAddUp} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  logo: {
    width: 160,
    height: 160,
  },
  bottomText: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#555',
    fontSize: 12,
  },

  emptyText: {
    textAlign: 'center',
    marginVertical: 100,
    fontSize: 18,
    lineHeight: 30,
  },
})
