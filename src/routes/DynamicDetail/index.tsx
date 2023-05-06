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
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'

const DynamicDetail: React.FC<
  NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>
> = ({ route }) => {
  const {
    text,
    name,
    date,
    commentId,
    commentType,
    type,
    payload,
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
        {type === HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW ? (
          <View style={styles.imagesContainer}>
            {payload.images?.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                style={{ marginVertical: 0 }}>
                {payload.images.map((img, i) => {
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
        ) : type === HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD ? (
          <View>
            <Text>{payload.text}</Text>
            {payload.image ? (
              <Image
                source={{ uri: payload.image }}
                style={{ width: 200, height: 100, marginTop: 10 }}
              />
            ) : null}
          </View>
        ) : null}

        <CommentList
          upName={name}
          commentId={commentId}
          commentType={commentType}
          dividerRight={
            <View style={styles.info}>
              <View style={styles.iconText}>
                <Icon name="date-range" size={15} color="#666" />
                <Text style={styles.text}>{date}</Text>
              </View>
              <View style={styles.iconText}>
                <Icon name="thumb-up-off-alt" size={15} color="#666" />
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
                  size={20}
                  color="#666"
                />
                {forwardCount ? (
                  <Text style={styles.text}>{parseNumber(forwardCount)}</Text>
                ) : null}
              </Pressable>
            </View>
          }
        />
      </ScrollView>
      {type === HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW &&
      payload.images &&
      payload.images.length > 0 ? (
        <ImagesView
          images={payload.images}
          visible={visible}
          imageIndex={imageIndex}
          setImageIndex={setImageIndex}
          setVisible={setVisible}
        />
      ) : null}
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
    paddingHorizontal: 10,
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
    fontSize: 12,
  },
  share: { flexDirection: 'row', alignItems: 'center', gap: 3 },
})
export default DynamicDetail
