import React from 'react'
import { View, Linking, StyleSheet, Image, Pressable } from 'react-native'
import { Icon, Text } from '@rneui/themed'
import { githubLink, site } from '../../constants'

export default React.memo(function Header() {
  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => {
          Linking.openURL(site)
        }}>
        <Image
          source={require('../../../assets/minibili.png')}
          style={styles.logo}
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
  logo: { width: 300, height: 90 },
  title: { fontSize: 24 },
})
