import React from 'react'
import { ScrollView, View } from 'react-native'
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
    <ScrollView className="p-5">
      <Header />
      <Divider className="my-4" />
      <Version />
      <Feedback />
      <Backup />
      <Statement />
      <Divider className="mb-4" />
      <BlackTags />
      <BlackUps />
      <SortCate />
      <View className="h-10" />
    </ScrollView>
  )
  return content
})
