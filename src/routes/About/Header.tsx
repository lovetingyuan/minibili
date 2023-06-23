import React from 'react'
import { View, Linking, StyleSheet, Pressable } from 'react-native'
import { Icon, Text } from '@rneui/themed'
import { githubLink, site } from '../../constants'
import MyImage from '../../components/MyImage'

export default React.memo(function Header() {
  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => {
          Linking.openURL(site)
        }}>
        <MyImage
          source={require('../../../assets/minibili.png')}
          widthScale={0.85}
          style={{ marginTop: 10 }}
        />
      </Pressable>
      <View style={styles.infoItem}>
        <Text style={styles.title}>一款简单的B站浏览App</Text>
        <Icon
          name="github"
          type="material-community"
          size={20}
          onPress={() => {
            Linking.openURL(githubLink)
          }}
        />
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
