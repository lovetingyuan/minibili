import {
  Avatar,
  Button,
  Dialog,
  Icon,
  SearchBar,
  Text,
  useTheme,
} from '@rneui/themed'
import React from 'react'
import { SearchedUpType, useSearchUps } from '../../api/search-up'
import { FlatList, Linking, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { parseNumber } from '../../utils'
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
  }
  const goToDynamic = () => {
    Linking.openURL(`https://m.bilibili.com/space/${up.mid}`)
  }
  return (
    <View key={up.mid} style={styles.upItem}>
      <Avatar
        ImageComponent={Image}
        size={40}
        rounded
        source={{ uri: up.face + '@100w_100h_1c.webp' }}
        onPress={goToDynamic}
      />
      <Text style={styles.upName} onPress={goToDynamic}>
        {up.name}
        {'\n'}
        <Text style={styles.fansText}>{parseNumber(up.fans)}粉丝</Text>
      </Text>
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

export default function AddFollow(props: { show: number }) {
  const [addUpVisible, setAddUpVisible] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const handleAddUpVisible = () => {
    setSearchValue('')
    setAddUpVisible(false)
  }
  const { theme } = useTheme()
  React.useEffect(() => {
    if (props.show) {
      setAddUpVisible(true)
    }
  }, [props.show])
  const { data: searchedUps, isValidating } = useSearchUps(searchValue)
  return (
    <Dialog
      isVisible={addUpVisible}
      onBackdropPress={handleAddUpVisible}
      overlayStyle={styles.dialog}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>新增关注</Text>
        <Icon name="close" size={24} onPress={handleAddUpVisible} />
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
            searchValue ? <Text style={styles.emptyText}>暂无结果</Text> : null
          }
          ListFooterComponent={
            searchedUps?.length ? (
              <Text style={styles.bottomText}>暂不支持更多结果~</Text>
            ) : null
          }
        />
      ) : null}
    </Dialog>
  )
}

const styles = StyleSheet.create({
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
  upName: { marginLeft: 10, fontSize: 15, flexGrow: 1 },
  emptyText: {
    textAlign: 'center',
    marginVertical: 30,
  },
  fansText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 20,
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
