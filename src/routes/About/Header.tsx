import React from 'react'
import { View, Linking, StyleSheet, Image } from 'react-native'
import { Icon, Text } from '@rneui/themed'
import { githubLink } from '../../constants'

export default React.memo(function Header() {
  return (
    <>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/minibili.png')}
          style={styles.logo}
        />
      </View>
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
