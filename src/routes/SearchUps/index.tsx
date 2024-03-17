import React from 'react'
import { SearchBarCommands } from 'react-native-screens'

import { colors } from '@/constants/colors.tw'
import useMounted from '@/hooks/useMounted'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import UpList from './UpList'

function SearchUps() {
  const searchBarRef = React.useRef<SearchBarCommands | null>(null)
  const blackColor = tw(colors.black.text).color
  const [searchKeyWord, setSearchKeyWord] = React.useState('')

  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
        headerSearchBarOptions: {
          ref: searchBarRef,
          placeholder: '搜索UP主',
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
    }, 80)
  })

  return <UpList keyword={searchKeyWord} />
}

export default React.memo(SearchUps)
