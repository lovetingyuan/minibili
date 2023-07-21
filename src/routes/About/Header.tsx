import React from 'react'
import {
  View,
  Linking,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native'
import { Button, Icon, Text } from '@rneui/themed'
import { githubLink, site } from '../../constants'

export default React.memo(function Header() {
  const { width } = useWindowDimensions()
  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => {
          if (__DEV__) {
            throw new Error('error happens')
          } else {
            Linking.openURL(site)
          }
        }}>
        <Image
          source={require('../../../assets/minibili.png')}
          style={{ width: width * 0.8, height: undefined, aspectRatio: 3.3 }}
        />
      </Pressable>
      <View style={styles.infoItem}>
        <Text style={styles.title}>一款简单的B站浏览App</Text>
        <Button
          radius={'sm'}
          type="clear"
          size="sm"
          onPress={() => {
            Linking.openURL(githubLink)
          }}>
          <Icon name="github" type="material-community" size={20} />
        </Button>
      </View>
    </>
  )
})

const styles = StyleSheet.create({
  container: { marginBottom: 10, flex: 1, alignItems: 'center' },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 24 },
})
