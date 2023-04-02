import React from 'react'
import { View, Pressable, ScrollView, Image, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import RichText from '../../components/RichText'
import CommentList from '../Play/CommentList'
import PagerView from 'react-native-pager-view'
import { Overlay } from '@rneui/base'

type Props = NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>

const DynamicDetail: React.FC<Props> = ({ navigation, route }) => {
  const [visible, setVisible] = React.useState(false)
  return (
    <>
      <View
        style={{
          flex: 1,
        }}>
        <View
          style={{
            marginHorizontal: 15,
            marginTop: 20,
            minHeight: 50,
            flexShrink: 1,
          }}>
          <RichText
            text={route.params.text}
            imageSize={16}
            textProps={{ style: { fontSize: 16, lineHeight: 25 } }}
          />
        </View>
        <View
          style={{
            marginVertical: 20,
            marginHorizontal: 15,
            flexShrink: 1,
          }}>
          {route.params.images.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              style={{ marginVertical: 0 }}>
              {route.params.images.map(img => {
                return (
                  <Pressable
                    key={img.src}
                    onPress={() => {
                      // Linking.openURL(img.src)
                      setVisible(true)
                    }}>
                    <Image
                      style={[styles.image, { aspectRatio: img.ratio }]}
                      key={img.src}
                      source={{
                        uri: img.src + '@240w_240h_1c.webp',
                      }}
                    />
                  </Pressable>
                )
              })}
            </ScrollView>
          ) : null}
        </View>

        <ScrollView
          style={{
            flex: 1,
            height: 100,
            flexGrow: 1,
            paddingHorizontal: 15,
          }}>
          <CommentList
            upName={route.params.name}
            commentId={route.params.commentId}
            commentType={route.params.commentType}
          />
        </ScrollView>
      </View>
      <Overlay
        isVisible={visible}
        fullScreen
        overlayStyle={{
          padding: 0,
          margin: 0,
          backgroundColor: 'rgba(0,0,0,0.01)',
        }}
        onBackdropPress={() => {
          setVisible(false)
        }}>
        <PagerView style={styles.viewPager} initialPage={0}>
          {route.params.images.map((img, i) => {
            return (
              <Pressable
                key={i}
                style={styles.page}
                onPress={() => {
                  // Linking.openURL(img.src)
                }}>
                <Image
                  style={[styles.imagePager, { aspectRatio: img.ratio }]}
                  key={img.src}
                  source={{
                    uri: img.src + '@240w_240h_1c.webp',
                  }}
                />
              </Pressable>
            )
          })}
        </PagerView>
      </Overlay>
    </>
  )
}

const styles = StyleSheet.create({
  image: {
    height: 120,
    marginRight: 20,
    marginVertical: 10,
  },
  textContainer: {
    flex: 1,
  },
  imagePager: {
    // flex: 1,
    width: '100%',
    // resizeMode: 'stretch',
  },

  // imagesContainer: {
  //   flex: 1,
  // },
  viewPager: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
export default DynamicDetail
