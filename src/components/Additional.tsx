import React from 'react'
import { StyleSheet, View, Pressable, Linking } from 'react-native'
import { AdditionalType } from '../api/dynamic-items.schema'
import { HandledAdditionalTypeEnum } from '../api/dynamic-items.type'
import { Image } from 'expo-image'
import { parseDate, parseNumber, parseUrl } from '../utils'
import { Text } from '@rneui/themed'

export const Additional = (props: { additional?: AdditionalType | null }) => {
  const { additional } = props
  if (!additional) {
    return null
  }
  let additionalContent = <Text>暂不支持</Text>
  let url = ''
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE) {
    const desc = [
      additional.reserve.desc1?.text,
      additional.reserve.desc2?.text,
    ]
      .filter(Boolean)
      .join('  ')
    url = additional.reserve.jump_url
    additionalContent = (
      <View style={{ gap: 2 }}>
        <Text>{additional.reserve.title}</Text>
        {desc ? <Text>{desc}</Text> : null}
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UGC
  ) {
    const text = [
      additional.ugc.head_text,
      additional.ugc.desc_second,
      additional.ugc.duration,
    ]
      .filter(Boolean)
      .join('  ')
    url = additional.ugc.jump_url
    additionalContent = (
      <View style={{ gap: 10, flexDirection: 'row', paddingRight: 10 }}>
        <Image
          source={{ uri: additional.ugc.cover + '@200w_100h_1c.webp' }}
          style={{ width: 100, minHeight: 50, borderRadius: 4 }}
        />
        <View style={{ flexShrink: 1, gap: 4, flex: 1 }}>
          <Text numberOfLines={1}>{additional.ugc.title}</Text>
          {text ? <Text numberOfLines={2}>{text}</Text> : null}
        </View>
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_COMMON
  ) {
    const text = [
      additional.common.head_text,
      additional.common.desc1,
      additional.common.desc2,
    ]
      .filter(Boolean)
      .join('  ')
    url = additional.common.jump_url
    additionalContent = (
      <View
        style={{
          gap: 10,
          flexDirection: 'row',
          paddingRight: 10,
        }}>
        <Image
          source={{ uri: additional.common.cover + '@200w_100h_1c.webp' }}
          style={{ width: 100, minHeight: 50, borderRadius: 4 }}
        />
        <View style={{ flexShrink: 1, gap: 4, flex: 1 }}>
          <Text numberOfLines={1}>{additional.common.title}</Text>
          {text ? (
            <Text numberOfLines={2} style={{ fontSize: 13 }}>
              {text}
            </Text>
          ) : null}
        </View>
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_GOODS
  ) {
    const text = [
      additional.goods.items[0]?.name,
      additional.goods.items[0]?.price,
    ]
      .filter(Boolean)
      .join(' ')
    url = additional.goods.jump_url || additional.goods.items[0].jump_url
    additionalContent = (
      <View style={{ gap: 2, flex: 1 }}>
        <Text numberOfLines={1}>商品：{additional.goods.head_text}</Text>
        {text ? <Text numberOfLines={1}>{text}</Text> : null}
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_VOTE
  ) {
    url =
      'https://t.bilibili.com/vote/h5/index/#/result?vote_id=' +
      additional.vote.vote_id
    additionalContent = (
      <View style={{ gap: 2 }}>
        <Text>投票：{additional.vote.desc}</Text>
        <Text>
          {parseDate(additional.vote.end_time)}截至，
          {parseNumber(additional.vote.join_num) || 0}人参与
        </Text>
      </View>
    )
  }
  const Foo = url ? Pressable : View
  const linkProp = url
    ? {
        onPress: () => {
          Linking.openURL(parseUrl(url))
        },
      }
    : {}
  return (
    <Foo {...linkProp} style={styles.additionalContainer}>
      {additionalContent}
    </Foo>
  )
}

const styles = StyleSheet.create({
  additionalContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#bbb',
    paddingLeft: 8,
    marginTop: 8,
    paddingVertical: 2,
  },
})
