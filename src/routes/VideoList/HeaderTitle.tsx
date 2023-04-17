import { Button, Icon, Overlay } from '@rneui/themed'
import { Pressable, ScrollView, Text, View } from 'react-native'
import store from '../../store'
import { useSnapshot } from 'valtio'
import React from 'react'
import { StyleSheet } from 'react-native'

const HeaderTitle = () => {
  const [visible, setVisible] = React.useState(false)
  const { videosType, ranksList } = useSnapshot(store)
  return (
    <View>
      <Pressable
        style={styles.titleContainer}
        onPress={() => {
          setVisible(true)
        }}>
        <Text style={styles.title}>
          {videosType.label +
            (videosType.rid === -1 ? '' : '排行') +
            (__DEV__ ? ' dev ' : ' ')}
        </Text>
        <Icon name="triangle-down" type="octicon" size={28} color="#333" />
      </Pressable>
      <Overlay
        isVisible={visible}
        backdropStyle={styles.backdrop}
        overlayStyle={styles.overlay}
        onBackdropPress={() => {
          setVisible(false)
        }}>
        <ScrollView style={styles.typeList}>
          {ranksList.map((item, i) => {
            return (
              <Button
                type={item.rid === videosType.rid ? 'solid' : 'clear'}
                key={item.rid}
                containerStyle={
                  {
                    // paddingVertical: 3,
                  }
                }
                titleStyle={
                  i
                    ? { marginVertical: 3 }
                    : { fontWeight: 'bold', marginVertical: 3 }
                }
                onPress={() => {
                  store.videosType = item
                  setVisible(false)
                }}>
                {item.label}
              </Button>
            )
          })}
        </ScrollView>
      </Overlay>
    </View>
  )
}

export default HeaderTitle

const styles = StyleSheet.create({
  overlay: {
    paddingHorizontal: 0,
    // paddingVertical: 10,
    position: 'absolute',
    top: 50,
    left: 15,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.0001)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  typeList: { width: 100, maxHeight: 400 },
})
