import React from 'react'
import { View, Pressable, ScrollView, Image, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import RichText from '../../components/RichText'
import CommentList from '../../components/CommentList'
import Header from './Header'
import ImagesView from './ImagesView'

const DynamicDetail: React.FC<
  NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>
> = ({ route }) => {
  const {
    text,
    name,
    date,
    commentId,
    commentType,
    payload: { images },
    id,
    face,
    forwardCount,
    likeCount,
  } = route.params.detail
  const [imageIndex, setImageIndex] = React.useState(0)
  const [visible, setVisible] = React.useState(false)

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
                      setImageIndex(i)
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
        <Header
          face={face}
          id={id}
          forwardCount={forwardCount}
          likeCount={likeCount}
          name={name}
          text={text || ''}
          date={date}
        />
        <ScrollView style={styles.scrollView}>
          <CommentList
            upName={name}
            commentId={commentId}
            commentType={commentType}
          />
        </ScrollView>
      </View>
      <ImagesView
        images={images}
        visible={visible}
        imageIndex={imageIndex}
        setImageIndex={setImageIndex}
      />
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
    marginHorizontal: 15,
    flexShrink: 1,
  },
  pagerImage: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
    height: 100,
    flexGrow: 1,
    paddingHorizontal: 15,
    marginTop: 10,
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
