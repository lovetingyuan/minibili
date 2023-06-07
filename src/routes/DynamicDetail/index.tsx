import React from 'react'
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ToastAndroid,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import CommentList from '../../components/CommentList'
import { Icon, Text, useTheme } from '@rneui/themed'
import { handleShareVideo, parseNumber } from '../../utils'
import DynamicItem from '../Dynamic/DynamicItem'
import { useFocusEffect } from '@react-navigation/native'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { setViewingDynamicId } from '../../utils/report'

const DynamicDetail: React.FC<
  NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>
> = ({ route }) => {
  const {
    text,
    name,
    date,
    commentId,
    commentType,
    id,
    forwardCount,
    likeCount,
  } = route.params.detail
  useFocusEffect(
    useMemoizedFn(() => {
      setViewingDynamicId(id)
      return () => {
        setViewingDynamicId(null)
      }
    }),
  )
  const { theme } = useTheme()
  return (
    <ScrollView style={styles.scrollView}>
      <DynamicItem item={route.params.detail} />
      <CommentList
        upName={name}
        commentId={commentId}
        commentType={commentType}
        dividerRight={
          <View style={styles.info}>
            <View style={styles.iconText}>
              <Icon name="date-range" size={15} color={theme.colors.grey1} />
              <Text style={[styles.text, { color: theme.colors.grey1 }]}>
                {date}
              </Text>
            </View>
            <Pressable
              style={styles.iconText}
              onPress={() => {
                ToastAndroid.show('不支持点赞', ToastAndroid.SHORT)
              }}>
              <Icon
                name="thumb-up-off-alt"
                size={15}
                color={theme.colors.grey1}
              />
              {likeCount ? (
                <Text style={[styles.text, { color: theme.colors.grey1 }]}>
                  {parseNumber(likeCount)}
                </Text>
              ) : null}
            </Pressable>
            <Pressable
              style={styles.share}
              onPress={() => {
                handleShareVideo(name, text ? text.substring(0, 30) : '-', id)
              }}>
              <Icon
                type="material-community"
                name="share"
                size={20}
                color={theme.colors.grey1}
              />
              {forwardCount ? (
                <Text style={[styles.text, { color: theme.colors.grey1 }]}>
                  {parseNumber(forwardCount)}
                </Text>
              ) : null}
            </Pressable>
          </View>
        }
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  textContainer: {
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
    flexShrink: 1,
  },
  pagerImage: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
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
