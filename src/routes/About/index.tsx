import { Divider } from '@rneui/themed'
import React from 'react'
import { ScrollView, View } from 'react-native'

import Backup from './Backup'
import Header from './Banner'
import BlackTags from './BlackTags'
import BlackUps from './BlackUps'
import Collect from './Collect'
import Feedback from './Feedback'
import History from './History'
import Music from './Music'
import SortCate from './SortCate'
import Statement from './Statement'
import Version from './Version'

export default React.memo(About)

function About() {
  const content = (
    <ScrollView className="p-5">
      <Header />
      <Divider className="my-4" />
      <View className="gap-2">
        <Version />
        <Feedback />
        <Backup />
        <Collect />
        <History />
        <Music />
        <Statement />
      </View>
      <Divider className="my-4" />
      <BlackTags />
      <BlackUps />
      <SortCate />
      <View className="h-10" />
    </ScrollView>
  )
  return content
}
