import { Button, Icon, Overlay, Text, useTheme } from '@rneui/themed'
import { Pressable, ScrollView, View } from 'react-native'
import store, { useStore } from '../../store'
import React from 'react'
import { StyleSheet } from 'react-native'

const HeaderTitle = () => {
  const [visible, setVisible] = React.useState(false)
  const { videosType, ranksList } = useStore()
  const { theme } = useTheme()
  return (
    <View>
      <Pressable
        style={styles.titleContainer}
        onPress={() => {
          setVisible(true)
        }}>
        <Text style={[styles.title, { color: theme.colors.grey1 }]}>
          {videosType.label +
            (videosType.rid === -1 ? '' : '排行') +
            (__DEV__ && ' dev ')}
        </Text>
        <Icon
          name="triangle-down"
          type="octicon"
          size={28}
          color={theme.colors.grey1}
        />
      </Pressable>
      <Overlay
        isVisible={visible}
        backdropStyle={styles.backdrop}
        overlayStyle={[styles.overlay]}
        onBackdropPress={() => {
          setVisible(false)
        }}>
        <ScrollView style={styles.typeList}>
          {ranksList.map((item, i) => {
            return (
              <Button
                type={item.rid === videosType.rid ? 'solid' : 'clear'}
                key={item.rid}
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
