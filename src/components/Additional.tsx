import React from 'react'
import { View, Pressable, Linking } from 'react-native'
import { AdditionalType } from '../api/dynamic-items.schema'
import { HandledAdditionalTypeEnum } from '../api/dynamic-items.type'
import { Image } from 'expo-image'
import { imgUrl, parseDate, parseNumber, parseUrl } from '../utils'
import { Text } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../types'

export function Additional(props: { additional?: AdditionalType | null }) {
  const { additional } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  if (!additional) {
    return null
  }
  let additionalContent: React.ReactElement | null = <Text>暂不支持显示</Text>
  let url = ''
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE) {
    const desc = [
      additional.reserve.desc1?.text,
      additional.reserve.desc2?.text,
    ]
      .filter(Boolean)
      .join('  ')
    url = additional.reserve.jump_url || ''
    const title = additional.reserve.title
    if (!title && !desc) {
      return null
    }
    additionalContent = (
      <View className="flex-1">
        {title ? <Text>{title}</Text> : null}
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
      <View className="gap-2.5 flex-row pr-2.5">
        <Image
          source={{ uri: imgUrl(additional.ugc.cover, 200, 100) }}
          className="w-24 min-h-12 rounded"
        />
        <View className="shrink flex-1 gap-1">
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
      <View className="gap-2.5 flex-row pr-2.5">
        <Image
          source={{ uri: imgUrl(additional.common.cover, 200, 100) }}
          className="w-24 min-h-12 rounded"
        />
        <View className="shrink flex-1 gap-1">
          <Text numberOfLines={1}>{additional.common.title}</Text>
          {text ? (
            <Text numberOfLines={2} className="text-sm">
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
      <View className="flex-1">
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
      <View className="flex-1">
        <Text>投票：{additional.vote.desc}</Text>
        <Text>
          {parseDate(additional.vote.end_time)}截至，
          {parseNumber(additional.vote.join_num) || 0}人参与
        </Text>
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_MATCH
  ) {
    url = parseUrl(additional.match.jump_url)
    const { title, center_top, center_bottom, left_team, right_team } =
      additional.match.match_info
    additionalContent = (
      <View className="gap-2">
        <Text>赛事：{additional.match.head_text}</Text>
        <Text>
          {title} {left_team.name} VS {right_team.name}{' '}
          {center_bottom + '-' + center_top.join('')}
        </Text>
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UPOWER_LOTTERY
  ) {
    url = parseUrl(additional.upower_lottery.jump_url)
    additionalContent = (
      <View className="gap-2">
        <Text>抽奖：{additional.upower_lottery.title}</Text>
        <Text>{additional.upower_lottery.desc.text}</Text>
      </View>
    )
  }
  const Foo = url ? Pressable : View
  const linkProp = url
    ? {
        onPress: () => {
          if (
            additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UGC
          ) {
            const bvid = url.match(/\/(BV[0-9a-zA-Z]+)\//)?.[1]
            if (bvid) {
              navigation.push('Play', {
                bvid,
                title: additional.ugc.title,
                desc: additional.ugc.head_text,
              })
              return
            }
          }
          Linking.openURL(parseUrl(url))
        },
      }
    : {}
  return (
    <Foo
      {...linkProp}
      className="border-l flex-1 border-zinc-200 pl-2 mt-5 py-1">
      {additionalContent}
    </Foo>
  )
}
