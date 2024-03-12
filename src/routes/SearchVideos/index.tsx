import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import type { SearchBarCommands } from 'react-native-screens'

import { colors } from '@/constants/colors.tw'
import useMounted from '@/hooks/useMounted'
import type { RootStackParamList } from '@/types'

import VideoList from './VideoList'

type Props = NativeStackScreenProps<RootStackParamList, 'SearchVideos'>

function SearchVideos(props: Props) {
  const searchBarRef = React.useRef<SearchBarCommands | null>(null)
  const blackColor = tw(colors.black.text).color
  const [searchKeyWord, setSearchKeyWord] = React.useState('')

  React.useEffect(() => {
    props.navigation.setOptions({
      headerSearchBarOptions: {
        ref: searchBarRef,
        placeholder: '搜索视频',
        headerIconColor: blackColor,
        hintTextColor: blackColor,
        textColor: blackColor,
        tintColor: blackColor,
        disableBackButtonOverride: false,
        shouldShowHintSearchIcon: false,
        onClose: () => {
          setSearchKeyWord('')
        },
        onSearchButtonPress: ({ nativeEvent: { text } }) => {
          const keyword = text.trim()
          if (!keyword) {
            return
          }
          setSearchKeyWord(keyword)
        },
      },
    })

    const unsubscribe = props.navigation.addListener('beforeRemove', () => {
      setSearchKeyWord('')
    })

    return unsubscribe
  }, [props.navigation, blackColor, searchKeyWord])

  useMounted(() => {
    setTimeout(() => {
      searchBarRef.current?.focus()
      searchBarRef.current?.setText('')
    }, 100)
  })

  return <VideoList keyword={searchKeyWord} />
}

export default React.memo(SearchVideos)
