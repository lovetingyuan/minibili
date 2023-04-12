import { useNavigation } from '@react-navigation/native'
import React from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native'
import { DynamicItemType, DynamicTypeEnum } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import { NavigationProps } from '../../types'
import DateAndOpen from './DateAndOpen'

export default function RichTextItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_DRAW>,
) {
  const {
    text,
    date,
    name,
    commentId,
    payload: { images },
  } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('DynamicDetail', {
          detail: props,
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
                <View key={img.src}>
                  <Image
                    style={[styles.image, { aspectRatio: img.ratio }]}
                    source={{
                      uri: img.src + '@240w_240h_1c.webp',
                    }}
                  />
                </View>
              )
            })}
          </ScrollView>
        ) : null}
        {props.payload.text ? <Text>{props.payload.text}</Text> : null}
        <DateAndOpen
          title={props.text || ''}
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
    height: 90,
    marginRight: 20,
    marginVertical: 10,
    borderRadius: 4,
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