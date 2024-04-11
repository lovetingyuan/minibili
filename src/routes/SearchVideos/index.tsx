import { useBackHandler } from '@react-native-community/hooks'
import { useIsFocused } from '@react-navigation/native'
import React from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import type { SearchBarCommands } from 'react-native-screens'

import { colors } from '@/constants/colors.tw'
import useMounted from '@/hooks/useMounted'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import VideoList from './VideoList'

function SearchVideos() {
  const searchBarRef = React.useRef<SearchBarCommands | null>(null)
  const blackColor = tw(colors.black.text).color
  const [searchKeyWord, setSearchKeyWord] = React.useState('')
  const focused = useIsFocused()
  useBackHandler(() => {
    if (searchKeyWord && focused) {
      searchBarRef.current?.blur()
      searchBarRef.current?.setText('')
      setSearchKeyWord('')
      return true
    }
    return false
  })
  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
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
      }
    }, [blackColor]),
  )

  useMounted(() => {
    setTimeout(() => {
      searchBarRef.current?.focus()
      searchBarRef.current?.setText('')
    }, 200)
  })

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1">
      <VideoList
        keyword={searchKeyWord}
        onSearch={(keyword: string) => {
          searchBarRef.current?.setText(keyword)
          searchBarRef.current?.blur()
          setSearchKeyWord(keyword)
        }}
      />
    </KeyboardAvoidingView>
  )
}

export default React.memo(SearchVideos)
