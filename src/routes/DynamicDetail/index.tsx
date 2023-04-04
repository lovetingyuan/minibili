import React from 'react'
import {
  View,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  Text,
  Linking,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import RichText from '../../components/RichText'
import CommentList from '../Play/CommentList'
import PagerView from 'react-native-pager-view'
import { Divider, Overlay } from '@rneui/base'
import { useNetInfo } from '@react-native-community/netinfo'
// import { downloadImage } from '../../utils'

type Props = NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>

const DynamicDetail: React.FC<Props> = ({ route }) => {
  const [visible, setVisible] = React.useState(false)
  const {
    text,
    name,
    commentId,
    commentType,
    payload: { images },
  } = route.params.item
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const netinfo = useNetInfo()
  return (
    <>
      <View
        style={{
          flex: 1,
        }}>
        <View style={styles.textContainer}>
          <RichText
            text={text}
            imageSize={16}
            textProps={{ style: { fontSize: 16, lineHeight: 25 } }}
          />
        </View>
        <View style={styles.imagesContainer}>
          {images.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              style={{ marginVertical: 0 }}>
              {images.map((img, i) => {
                return (
                  <Pressable
                    key={img.src}
                    onPress={() => {
                      setCurrentImageIndex(i)
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
        <Divider />
        <ScrollView style={styles.scrollView}>
          <CommentList
            upName={name}
            commentId={commentId}
            commentType={commentType}
          />
        </ScrollView>
      </View>
      <Overlay
        isVisible={visible}
        fullScreen
        overlayStyle={styles.overlay}
        onBackdropPress={() => {
          setVisible(false)
        }}>
        <PagerView
          style={styles.viewPager}
          initialPage={currentImageIndex}
          onPageSelected={e => {
            setCurrentImageIndex(e.nativeEvent.position)
          }}>
          {images.map(img => {
            return (
              <View key={img.src} style={styles.page}>
                <Pressable
                  onPress={() => {
                    Linking.openURL(img.src)
                  }}>
                  <Image
                    style={[styles.pagerImage, { aspectRatio: img.ratio }]}
                    key={img.src}
                    loadingIndicatorSource={require('../../../assets/loading.png')}
                    source={{
                      uri:
                        netinfo.type === 'wifi'
                          ? img.src
                          : img.src + '@640w_640h_2c.webp',
                    }}
                  />
                </Pressable>
              </View>
            )
          })}
        </PagerView>
        <View style={styles.pagerNum}>
          <Text style={styles.pagerNumText}>
            {currentImageIndex + 1}/{images.length}
          </Text>
          {/* <Button
            size="sm"
            type="clear"
            titleStyle={{ color: 'white' }}
            onPress={() => {
              downloadImage(images[currentImageIndex].src)
            }}>
            下载
          </Button> */}
        </View>
      </Overlay>
    </>
  )
}

const styles = StyleSheet.create({
  textContainer: {
    marginHorizontal: 15,
    marginTop: 20,
    minHeight: 50,
    flexShrink: 1,
  },
  image: {
    height: 120,
    marginRight: 20,
    marginVertical: 10,
  },
  imagesContainer: {
    marginVertical: 20,
    marginHorizontal: 15,
    flexShrink: 1,
  },
  pagerImage: {
    // flex: 1,
    width: '100%',

    // borderColor: 'red',
    backgroundColor: 'red',
    // height: '100%',
    // resizeMode: 'stretch',
  },
  scrollView: {
    flex: 1,
    height: 100,
    flexGrow: 1,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  overlay: {
    padding: 0,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  viewPager: {
    flex: 1,
  },
  page: {
    // borderWidth: 1,
    // borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagerNum: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pagerNumText: {
    color: 'white',
    fontSize: 16,
  },
})
export default DynamicDetail
