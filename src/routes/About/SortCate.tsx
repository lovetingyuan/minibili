import { Chip, Icon, ListItem, Text } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import { useStore } from '../../store'

export default React.memo(SortCate)

function SortCate() {
  const [expandedCate, setExpandedCate] = React.useState(false)
  const { $videoCatesList, set$videoCatesList } = useStore()
  const [sortedRankList, setSortedRankList] = React.useState<
    { rid: number; label: string }[]
  >([])
  const [, ...initUnsortedRankList] = $videoCatesList
  const [unsortedRankList, setUnSortedRankList] =
    React.useState(initUnsortedRankList)
  return (
    <ListItem.Accordion
      icon={<Icon name={'chevron-down'} type="material-community" />}
      containerStyle={tw('p-0 mt-1 mb-3 bg-transparent')}
      content={
        <ListItem.Content>
          <ListItem.Title>调整分区顺序</ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expandedCate}
      onPress={() => {
        setExpandedCate(!expandedCate)
      }}>
      <ListItem
        containerStyle={tw('flex-wrap p-0 flex-row px-1 bg-transparent')}>
        <View className="flex-row flex-wrap border-b-[0.5px] flex-1 w-full gap-x-3 border-b-gray-400	">
          {sortedRankList.map(cate => {
            return (
              <Chip
                title={cate.label}
                key={cate.rid}
                type="outline"
                onPress={() => {
                  const a = sortedRankList.filter(v => v.rid !== cate.rid)
                  const b = unsortedRankList.concat(cate)
                  setSortedRankList(a)
                  setUnSortedRankList(b)
                  set$videoCatesList([$videoCatesList[0], ...a, ...b])
                }}
                containerStyle={tw('mb-2')}
                buttonStyle={tw('px-[6px] py-[2px]')}
              />
            )
          })}
          {sortedRankList.length === 0 && (
            <Text className={`flex-1 mb-1 ${colors.gray6.text}`}>
              {' '}
              点击名称调整顺序
            </Text>
          )}
        </View>
        <View className="flex-row flex-wrap gap-x-3 mt-5">
          {unsortedRankList.map(cate => {
            return (
              <Chip
                title={cate.label}
                key={cate.rid}
                type="outline"
                onPress={() => {
                  const a = sortedRankList.concat(cate)
                  const b = unsortedRankList.filter(v => v.rid !== cate.rid)
                  setSortedRankList(a)
                  setUnSortedRankList(b)
                  set$videoCatesList([$videoCatesList[0], ...a, ...b])
                }}
                containerStyle={tw('mb-2')}
                buttonStyle={tw('px-2 py-[2px]')}
              />
            )
          })}
        </View>
      </ListItem>
    </ListItem.Accordion>
  )
}
