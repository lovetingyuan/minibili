import React from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { Divider } from '@rneui/themed'
import Feedback from './Feedback'
import Header from './Header'
import Version from './Version'
import Statement from './Statement'
import BlackUps from './BlackUps'
import BlackTags from './BlackTags'
import SortCate from './SortCate'
import Backup from './Backup'

export default React.memo(function About() {
  const content = (
    <ScrollView style={styles.container}>
      <Header />
      <Divider style={{ marginBottom: 18, marginTop: 15 }} />
      <Version />
      <Feedback />
      <Backup />
      <Statement />
      <Divider style={{ marginBottom: 18 }} />
      <BlackTags />
      <BlackUps />
      <SortCate />
      <View style={{ height: 40 }} />
    </ScrollView>
  )
  return content
  // return (
  //   // <ScrollView style={styles.container}>
  //   <ImageBackground
  //     source={require('../../../assets/bg2.webp')}
  //     resizeMode="cover"
  //     style={styles.bgImage}>
  //     {content}
  //   </ImageBackground>
  //   // </ScrollView>
  // )
})

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  bgImage: {
    flex: 1,
    justifyContent: 'center',
  },
})
