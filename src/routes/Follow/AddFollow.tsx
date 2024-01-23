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
import { FlatList, Linking, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { imgUrl, parseNumber, showToast } from '../../utils'
import { useStore } from '../../store'

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
  const { theme } = useTheme()
  const handler = () => {
    set$followedUps([user, ...get$followedUps()])
  }
  const goToDynamic = () => {
    Linking.openURL(`https://m.bilibili.com/space/${up.mid}`)
  }
  return (
    <View key={up.mid} className="mb-3 flex-row flex-1 items-center">
      <Avatar
        size={40}
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
      <Text className="text-xs ml-2" style={{ color: theme.colors.grey2 }}>
        {parseNumber(up.fans)}粉丝
      </Text>

      {followed ? (
        <Button
          size="sm"
          type="clear"
          disabled
          titleStyle={{ color: theme.colors.grey3 }}>
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
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const { data: searchedUps, isValidating } = useSearchUps(searchValue)
  return (
    <>
      <FAB
        visible
        color={theme.colors.secondary}
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
          <Text className="font-bold text-lg opacity-85">新增关注</Text>
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
                    className="aspect-square self-center mt-8"
                    style={{
                      width: width * 0.3,
                    }}
                  />
                  <Text className="text-center my-8">暂无结果</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              searchedUps?.length ? (
                <Text
                  className="text-center pb-3 text-xs"
                  style={{ color: theme.colors.grey3 }}>
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
