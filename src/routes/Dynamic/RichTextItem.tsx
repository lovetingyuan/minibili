import { useNavigation } from '@react-navigation/native'
// import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native'
import RichText from '../../components/RichText'
import { NavigationProps } from '../../types'
// import { AppContext } from '../../context';
// import { RootStackParamList } from '../../types'
import DateAndOpen from './DateAndOpen'
// type NavigationProps = NativeStackScreenProps<RootStackParamList>

export default function RichTextItem(props: {
  text: string
  date: string
  mid: number
  name: string
  commentId: string | number
  commentType: number
  images: { src: string; ratio: number }[]
}) {
  const { text, date, images, name, mid, commentId, commentType } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  return (
    // <Pressable
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('DynamicDetail', {
          text,
          images,
          commentId,
          commentType,
          name,
          mid,
          // bvid,
          // aid,
          // mid,
          // name,
        })
      }}>
      <View style={[styles.textContainer]}>
        <RichText
          text={text}
          imageSize={16}
          textProps={{ style: { fontSize: 16, lineHeight: 25 } }}
        />
        {images.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            style={styles.imagesContainer}>
            {images.map(img => {
              return (
                // <Pressable
                //   key={img.src}
                //   // onPress={() => {
                //   //   Linking.openURL(img.src)
                //   // }}
                // >
                <Image
                  style={[styles.image, { aspectRatio: img.ratio }]}
                  key={img.src}
                  source={{
                    uri: img.src + '@240w_240h_1c.webp',
                  }}
                />
                // </Pressable>
              )
            })}
          </ScrollView>
        ) : null}
        <DateAndOpen
          title={props.text}
          name={name}
          id={commentId}
          date={date}
        />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  textItem: {
    fontSize: 16,
    lineHeight: 26,
  },
  image: {
    height: 80,
    marginRight: 20,
    marginVertical: 10,
  },
  textContainer: {
    flex: 1,
  },
  imagesContainer: {
    flex: 1,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  date: { color: '#555', fontSize: 12 },
})
