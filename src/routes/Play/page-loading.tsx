import React from 'react'
import { View, Image, StyleSheet } from 'react-native'

export const Loading = (cover?: string) => {
  return (
    <View style={styles.loadingView}>
      <Image
        style={{
          flex: 1,
          width: cover ? '100%' : '80%',
        }}
        resizeMode="cover"
        source={
          cover ? { uri: cover } : require('../../../assets/video-loading.png')
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  loadingView: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    alignItems: 'center',
  },
})
