import {
  Avatar,
  Button,
  Dialog,
  FAB,
  Icon,
  SearchBar,
  Text,
  useTheme,
} from '@rneui/themed'
import React from 'react'
import { SearchedUpType, useSearchUps } from '../../api/search-up'
import {
  FlatList,
  Linking,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { imgUrl, parseNumber, showToast } from '../../utils'
import store, { useStore } from '../../store'

function SearchedItem(props: { up: SearchedUpType }) {
  const up = props.up
  const { $followedUps } = useStore()
  const followed = $followedUps.find(v => v.mid == up.mid)
  const user = {
    name: up.name,
    face: up.face,
    mid: up.mid,
    sign: up.sign,
  }
  const handler = () => {
    store.$followedUps.unshift(user)
    // store.$followedUps = [user, ...store.$followedUps]
  }
  const goToDynamic = () => {
    Linking.openURL(`https://m.bilibili.com/space/${up.mid}`)
  }
  return (
    <View key={up.mid} style={styles.upItem}>
      <Avatar
        size={40}
        rounded
        source={{ uri: imgUrl(up.face, 80) }}
        ImageComponent={Image}
        onPress={goToDynamic}
      />
      <Text style={styles.upName} onPress={goToDynamic} numberOfLines={2}>
        {up.name}
      </Text>
      <Text style={styles.fansText}>{parseNumber(up.fans)}粉丝</Text>

      {followed ? (
        <Button
          size="sm"
          type="clear"
          disabled
          titleStyle={styles.followedText}>
          已关注
        </Button>
      ) : (
        <Button size="sm" type="clear" onPress={handler}>
          <Icon name="add" size={16} color={'#2b9af3'} />
          关注
        </Button>
      )}
    </View>
  )
}

const renderSearchItem = ({ item: up }: { item: SearchedUpType }) => {
  return <SearchedItem up={up} />
}

export default function AddFollow() {
  const [addUpVisible, setAddUpVisible] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  const { $followedUps } = useStore()
  const handleAddUpVisible = (...args: any) => {
    if (args[0] && 'pageY' in args[0].nativeEvent) {
      return
    }
    setSearchValue('')
    setAddUpVisible(false)
  }
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const { data: searchedUps, isValidating } = useSearchUps(searchValue)
  return (
    <>
      <FAB
        visible
        color="#f25d8e"
        placement="right"
        icon={{ name: 'add', color: 'white' }}
        style={styles.addBtn}
        size="small"
        onPress={() => {
          if ($followedUps.length > 200) {
            showToast('暂时只支持最多200个关注')
            return
          }
          setAddUpVisible(true)
        }}
      />
      <Dialog
        isVisible={addUpVisible}
        onBackdropPress={handleAddUpVisible}
        overlayStyle={styles.dialog}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>新增关注</Text>
          <Icon name="close" size={24} onPress={() => handleAddUpVisible()} />
        </View>
        <SearchBar
          placeholder="请输入Up主的名字"
          autoFocus
          onChangeText={v => {
            setSearchValue(v.trim())
          }}
          cancelIcon={<Icon name="search" size={24} />}
          platform="android"
          showLoading={isValidating}
          value={searchValue}
          inputStyle={{ color: theme.colors.black }}
          containerStyle={styles.searchBar}
        />
        {searchValue ? (
          <FlatList
            data={searchedUps || []}
            renderItem={renderSearchItem}
            keyExtractor={item => item.mid + ''}
            ListEmptyComponent={
              searchValue && !isValidating ? (
                <View>
                  <Image
                    source={require('../../../assets/ss.png')}
                    style={{
                      width: width * 0.3,
                      height: undefined,
                      aspectRatio: 1,
                      alignSelf: 'center',
                      marginTop: 30,
                    }}
                  />
                  <Text style={styles.emptyText}>暂无结果</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              searchedUps?.length ? (
                <Text style={styles.bottomText}>暂不支持更多结果~</Text>
              ) : null
            }
          />
        ) : null}
      </Dialog>
    </>
  )
}

const styles = StyleSheet.create({
  addBtn: {
    bottom: 10,
    opacity: 0.8,
  },
  dialog: { maxHeight: '60%', width: '85%' },
  upItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10,
  },
  bottomText: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#555',
    fontSize: 12,
  },
  upName: { marginLeft: 10, fontSize: 15, flexGrow: 1, flexShrink: 1 },
  emptyText: {
    textAlign: 'center',
    marginVertical: 30,
  },
  fansText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold', opacity: 0.85 },
  searchBar: {
    backgroundColor: 'transparent',
  },
  followedText: { color: '#888' },
})
