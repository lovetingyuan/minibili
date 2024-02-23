import {
  Avatar,
  Button,
  Dialog,
  FAB,
  Icon,
  SearchBar,
  Text,
} from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { FlatList, Linking, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import { type SearchedUpType, useSearchUps } from '../../api/search-up'
import { useStore } from '../../store'
import { imgUrl, parseNumber, showToast } from '../../utils'

function SearchedItem(props: { up: SearchedUpType }) {
  const up = props.up
  const { _followedUpsMap, get$followedUps, set$followedUps } = useStore()
  const followed = up.mid in _followedUpsMap
  const user = {
    name: up.name,
    face: up.face,
    mid: up.mid,
    sign: up.sign,
  }
  const handler = () => {
    set$followedUps([user, ...get$followedUps()])
  }
  const goToDynamic = () => {
    Linking.openURL(`https://m.bilibili.com/space/${up.mid}`)
  }
  return (
    <View key={up.mid} className="mb-3 flex-row flex-1 items-center shrink-0">
      <Avatar
        size={36}
        rounded
        source={{ uri: imgUrl(up.face, 80) }}
        ImageComponent={Image}
        onPress={goToDynamic}
      />
      <Text
        className="ml-3 text-base grow shrink"
        onPress={goToDynamic}
        numberOfLines={2}>
        {up.name}
      </Text>
      <Text className="text-xs ml-2 text-gray-400">
        {parseNumber(up.fans)}粉丝
      </Text>

      {followed ? (
        <Button
          size="sm"
          type="clear"
          disabled
          titleStyle={tw(colors.gray3.text)}>
          已关注
        </Button>
      ) : (
        <Button size="sm" type="clear" onPress={handler}>
          <Icon name="add" size={16} color={tw(colors.primary.text).color} />
          关注
        </Button>
      )}
    </View>
  )
}

const renderSearchItem = ({ item: up }: { item: SearchedUpType }) => {
  return <SearchedItem up={up} />
}

export default React.memo(function AddFollow() {
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
  const { data: searchedUps, isValidating } = useSearchUps(searchValue)
  return (
    <>
      <FAB
        visible
        color={tw(colors.secondary.text).color}
        placement="right"
        icon={{ name: 'add', color: 'white' }}
        className="bottom-[10px] opacity-80"
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
        overlayStyle={tw('max-h-[60%] w-[85%]')}>
        <View className="flex-row justify-between items-center">
          <Text className="font-bold text-lg">新增关注</Text>
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
          inputStyle={tw(colors.black.text)}
          containerStyle={tw('bg-transparent')}
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
                    className="aspect-square w-[40%] self-center mt-8"
                  />
                  <Text className="text-center my-8">暂无结果</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              searchedUps?.length ? (
                <Text className="text-center pb-3 text-xs text-gray-500">
                  暂不支持更多结果~
                </Text>
              ) : null
            }
          />
        ) : null}
      </Dialog>
    </>
  )
})
