import React from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native'
import { Text, Icon, Dialog, SearchBar } from '@rneui/themed'
import FollowItem from './FollowItem'
import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { useStore } from '../../store'
import { FollowedUpItem } from '../../api/followed-ups'
import { checkUpdateUps } from '../../api/dynamic-items'
import commonStyles from '../../styles'
// import useIsDark from '../../hooks/useIsDark'
// import { FAB } from '@rneui/themed'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>

export default React.memo(function Follow({ navigation }: Props) {
  // eslint-disable-next-line no-console
  __DEV__ && console.log('Follow page')
  const { $followedUps, $upUpdateMap, livingUps, checkingUpUpdate } = useStore()
  const followListRef = React.useRef<FlatList | null>(null)
  const [addUpVisible, setAddUpVisible] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const handleAddUpVisible = () => {
    setSearchValue('')
    setAddUpVisible(false)
  }
  React.useEffect(() => {
    checkUpdateUps(true)
    const checkUpUpdateTimer = window.setInterval(() => {
      checkUpdateUps(false)
    }, 10 * 60 * 1000)
    return () => {
      if (typeof checkUpUpdateTimer === 'number') {
        clearInterval(checkUpUpdateTimer)
      }
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
              我的关注{count ? `(${count})` : ''}
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
            name="add"
            size={25}
            onPress={() => {
              setAddUpVisible(true)
            }}
          />
        )
      },
    })
  }, [navigation, $followedUps, checkingUpUpdate])

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

  const renderItem = ({
    item,
  }: // index,
  {
    item: FollowedUpItem | null
    index: number
  }) => {
    if (item) {
      return <FollowItem item={item} />
    }
    return <View style={commonStyles.flex1} />
  }

  let displayUps: (FollowedUpItem | null)[] = []
  const topUps: FollowedUpItem[] = []
  const updateUps: FollowedUpItem[] = []
  const otherUps: FollowedUpItem[] = []
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
          numColumns={columns}
          ref={followListRef}
          columnWrapperStyle={{
            paddingHorizontal: 10,
          }}
          contentContainerStyle={{
            paddingTop: 30,
          }}
          ListEmptyComponent={emptyContent()}
          ListFooterComponent={<Text style={styles.bottomText}>到底了~</Text>}
        />
      </View>
      {/* <FAB
        visible
        color="#f25d8e"
        placement="right"
        icon={{ name: 'add', color: 'white' }}
        style={{ bottom: 10 }}
        size="small"
      /> */}
      <Dialog isVisible={addUpVisible} onBackdropPress={handleAddUpVisible}>
        <Dialog.Title title="搜索Up主" />
        <SearchBar
          placeholder="请输入Up主的名字"
          onChangeText={v => {
            setSearchValue(v)
          }}
          // lightTheme={!isDark}
          platform="android"
          value={searchValue}
        />
        <Dialog.Actions>
          <Dialog.Button title="取消" onPress={handleAddUpVisible} />
        </Dialog.Actions>
      </Dialog>
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
