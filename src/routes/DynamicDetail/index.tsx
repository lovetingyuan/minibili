import React from 'react'
import {
  View,
  Pressable,
  Text,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import RichText from '../../components/RichText'
import CommentList from '../../components/CommentList'
import ImagesView from './ImagesView'
import { Icon } from '@rneui/themed'
import { handleShareVideo, parseNumber } from '../../utils'

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
    forwardCount,
    likeCount,
  } = route.params.detail
  const [imageIndex, setImageIndex] = React.useState(0)
  const [visible, setVisible] = React.useState(false)

  return (
    <>
      <ScrollView style={styles.scrollView}>
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
        <CommentList
          upName={name}
          commentId={commentId}
          commentType={commentType}
          dividerRight={
            <View style={styles.info}>
              <View style={styles.iconText}>
                <Icon name="date-range" size={16} color="#666" />
                <Text style={styles.text}>{date}</Text>
              </View>
              <View style={styles.iconText}>
                <Icon name="thumb-up-off-alt" size={16} color="#666" />
                <Text style={styles.text}>{parseNumber(likeCount)}</Text>
              </View>
              <Pressable
                style={styles.share}
                onPress={() => {
                  handleShareVideo(name, text ? text.substring(0, 30) : '-', id)
                }}>
                <Icon
                  type="material-community"
                  name="share"
                  size={22}
                  color="#666"
                />
                <Text style={styles.text}>{parseNumber(forwardCount)}</Text>
              </Pressable>
            </View>
          }
        />
      </ScrollView>
      <ImagesView
        images={images}
        visible={visible}
        imageIndex={imageIndex}
        setImageIndex={setImageIndex}
        setVisible={setVisible}
      />
    </>
  )
}

const styles = StyleSheet.create({
  textContainer: {
    // marginHorizontal: 15,
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
    // marginHorizontal: 15,
    flexShrink: 1,
  },
  pagerImage: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
    // height: 100,
    flexGrow: 1,
    paddingHorizontal: 15,
    // marginTop: 10,
    backgroundColor: 'white',
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
  upInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  upName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    flexDirection: 'row',
    flexShrink: 0,
    minWidth: 80,
    color: '#666',
    alignItems: 'center',
    gap: 10,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: '#555',
    fontSize: 13,
  },
  share: { flexDirection: 'row', alignItems: 'center', gap: 3 },
})
export default DynamicDetail