import React from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { Divider } from '@rneui/themed'
import Feedback from './Feedback'
import Header from './Header'
import Version from './Version'
// import User from './User'
import Statement from './Statement'
import BlackUps from './BlackUps'
import BlackTags from './BlackTags'
import SortCate from './SortCate'

export default React.memo(function About() {
  return (
    <ScrollView style={styles.container}>
      <Header />
      <Divider style={{ marginBottom: 18, marginTop: 15 }} />
      <Version />
      {/* <User /> */}
      <Feedback />
      <Statement />
      <Divider style={{ marginBottom: 18 }} />
      <BlackTags />
      <BlackUps />
      <SortCate />
      <View style={{ height: 40 }} />
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
})
