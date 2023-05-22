import React from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  Pressable,
  Linking,
} from 'react-native'
// import RichText from '../../components/RichText'
import { DynamicItemType } from '../../api/dynamic-items'
import {
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
} from '../../api/dynamic-items.type'
import { Avatar, Text } from '@rneui/themed'
import RichTexts from '../../components/RichTexts'
import { NavigationProps } from '../../types'
import { useNavigation } from '@react-navigation/native'
import useIsDark from '../../hooks/useIsDark'

export default function ForwardItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD>,
) {
  const { width } = useWindowDimensions()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const isDark = useIsDark()

  let forwardContent = <Text>暂不支持显示</Text>
  if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
    forwardContent = (
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {props.payload.text ? (
          <RichTexts
            idStr={props.payload.id}
            nodes={props.payload.richTexts}
            style={{ marginBottom: 10 }}
            textProps={{ numberOfLines: 3 }}
          />
        ) : null}
        <View style={{ flexDirection: 'row' }}>
          <Image
            style={styles.forwardContentImage}
            source={{ uri: props.payload.cover + '@240w_240h_1c.webp' }}
          />
          <View style={{ flex: 6 }}>
            <Text numberOfLines={2} style={{ lineHeight: 20 }}>
              <Text style={{ fontWeight: 'bold' }}>视频：</Text>
              {props.payload.title}
            </Text>
            <Text style={{ marginTop: 10, fontSize: 13 }}>
              {props.payload.play}播放
            </Text>
          </View>
        </View>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW) {
    forwardContent = (
      <View style={{ flexDirection: 'column' }}>
        <RichTexts
          idStr={props.payload.id}
          nodes={props.payload.richTexts}
          textProps={{ numberOfLines: 3 }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.imagesContainer}>
          {props.payload.images.map(img => {
            return (
              <Image
                style={[styles.image, { aspectRatio: img.ratio }]}
                key={img.src}
                source={{ uri: img.src + '@240w_240h_1c.webp' }}
              />
            )
          })}
        </ScrollView>
        {/* {props.payload.text2 ? <Text>{props.payload.text2}</Text> : null} */}
      </View>
    )
  } else if (
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE
  ) {
    forwardContent = (
      <View>
        <Text style={{ fontSize: 15, marginBottom: 10, fontWeight: 'bold' }}>
          {props.payload.title}
        </Text>
        <Text numberOfLines={3}>{props.payload.text}</Text>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD) {
    forwardContent = (
      <RichTexts idStr={props.payload.id} nodes={props.payload.richTexts} />
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE) {
    forwardContent = (
      <View>
        <Text>{props.payload.title}</Text>
        <Image
          source={{ uri: props.payload.cover }}
          style={{ width: 100, height: 50, marginTop: 5, borderRadius: 4 }}
        />
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC) {
    forwardContent = (
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <RichTexts
          idStr={props.payload.id}
          nodes={props.payload.richTexts}
          textProps={{ numberOfLines: 3 }}
        />
        <Image
          source={{ uri: props.payload.cover }}
          style={{
            width: 100,
            height: 80,
            borderRadius: 4,
          }}
        />
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold' }}>
            {props.payload.title}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 'normal' }}>
            {props.payload.label}
          </Text>
        </View>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC) {
    forwardContent = (
      <View style={{ gap: 10, flexDirection: 'row', flexShrink: 1 }}>
        <Image
          source={{ uri: props.payload.cover }}
          style={{
            width: width * 0.4,
            height: 80,
            borderRadius: 4,
          }}
        />
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
            {props.payload.title}
          </Text>
          <Text style={{ marginTop: 12, lineHeight: 23 }}>
            {props.payload.text}
          </Text>
        </View>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_NONE) {
    forwardContent = (
      <Text style={{ fontStyle: 'italic' }}>{props.payload.text}</Text>
    )
  }
  return (
    <View style={[styles.textContainer]}>
      <RichTexts
        idStr={props.id}
        nodes={props.richTexts}
        textProps={{ numberOfLines: 3 }}
      />
      <View
        style={[
          styles.forwardContainer,
          { backgroundColor: isDark ? '#222' : '#dedede' },
        ]}>
        <Pressable
          style={styles.forwardUp}
          onPress={() => {
            Linking.openURL('https://m.bilibili.com/space/' + props.payload.mid)
          }}>
          {props.payload.face && (
            <Avatar source={{ uri: props.payload.face }} size={22} rounded />
          )}
          {props.payload.name && (
            <Text style={styles.forwardUpName}>{props.payload.name}</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.forwardContent}
          onPress={() => {
            navigation.navigate('WebPage', {
              title: props.payload.name + '的动态',
              url: `https://m.bilibili.com/dynamic/${props.payload.id}`,
            })
          }}>
          {forwardContent}
        </Pressable>
      </View>
    </View>
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
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  forwardContainer: {
    flex: 1,
    marginBottom: 8,
    marginTop: 16,
    padding: 10,
    borderRadius: 4,
  },
  forwardUp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  forwardUpName: { fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  forwardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  forwardContentImage: {
    width: 150,
    height: 80,
    marginRight: 10,
    flex: 4,
    borderRadius: 4,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  date: { color: '#555', fontSize: 12 },
  imagesContainer: {},
})
