import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Skeleton } from '@rneui/themed'

const VideoLoading = (props: { index: number; a: boolean }) => {
  return (
    <View style={styles.item}>
      <Skeleton animation="pulse" width={'100%' as any} height={90} />
      <View style={styles.text}>
        <Skeleton animation="pulse" width={'80%' as any} height={15} />
        {props.index % 2 ? (
          <Skeleton animation="pulse" width={'50%' as any} height={15} />
        ) : (
          <View style={styles.empty} />
        )}
      </View>
      <View style={styles.user}>
        <Skeleton animation="pulse" width={60} height={12} />
        <Skeleton animation="pulse" width={50} height={12} />
      </View>
    </View>
  )
}

export default React.memo(() => {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View style={styles.itemContainer} key={i}>
              <VideoLoading index={i} a />
              <VideoLoading index={i} a={false} />
            </View>
          )
        })}
    </View>
  )
})

const styles = StyleSheet.create({
  itemContainer: {
    padding: 10,
    gap: 15,
    marginBottom: 10,
    marginTop: 10,
    flexDirection: 'row',
  },
  item: { flex: 1, gap: 10 },
  user: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: { gap: 8 },
  empty: { height: 10 },
})
