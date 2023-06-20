import { Chip, ListItem, Text, Icon } from '@rneui/themed'
import React from 'react'
import store, { useStore } from '../../store'
import { View, StyleSheet } from 'react-native'

export default React.memo(function SortCate() {
  const [expandedCate, setExpandedCate] = React.useState(false)
  const { $videoCatesList } = useStore()
  const [sortedRankList, setSortedRankList] = React.useState<
    { rid: number; label: string }[]
  >([])
  const [, ...initUnsortedRankList] = $videoCatesList
  const [unsortedRankList, setUnSortedRankList] =
    React.useState(initUnsortedRankList)
  return (
    <ListItem.Accordion
      icon={<Icon name={'chevron-down'} type="material-community" />}
      containerStyle={styles.blackTitle}
      content={
        <ListItem.Content>
          <ListItem.Title>调整分区顺序</ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expandedCate}
      onPress={() => {
        setExpandedCate(!expandedCate)
      }}>
      <ListItem containerStyle={styles.blackContent}>
        <View style={styles.sortedCates}>
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
                  store.$videoCatesList = [$videoCatesList[0], ...a, ...b]
                }}
                containerStyle={styles.chip}
                buttonStyle={styles.chipButton}
              />
            )
          })}
          {sortedRankList.length === 0 && (
            <Text style={styles.tipText}> 点击名称调整顺序</Text>
          )}
        </View>
        <View style={styles.cateList}>
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
                  store.$videoCatesList = [$videoCatesList[0], ...a, ...b]
                }}
                containerStyle={styles.chip}
                buttonStyle={styles.chipButton}
              />
            )
          })}
        </View>
      </ListItem>
    </ListItem.Accordion>
  )
})

const styles = StyleSheet.create({
  blackContent: {
    flexWrap: 'wrap',
    padding: 0,
    flexDirection: 'row',
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
  },
  blackTitle: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  sortedCates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 0.5,
    borderBottomColor: '#888',
    flex: 1,
    flexGrow: 1,
    width: '100%',
    columnGap: 10,
  },
  tipText: { flex: 1, marginBottom: 5 },
  cateList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    marginTop: 20,
  },
  chip: { marginBottom: 8 },
  chipButton: {
    padding: 0,
    paddingVertical: 2,
  },
})
