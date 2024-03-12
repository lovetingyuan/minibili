import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { SearchBarCommands } from 'react-native-screens'

import { colors } from '@/constants/colors.tw'
import useMounted from '@/hooks/useMounted'
import { RootStackParamList } from '@/types'

import UpList from './UpList'

type Props = NativeStackScreenProps<RootStackParamList, 'SearchUps'>

function SearchUps(props: Props) {
  const searchBarRef = React.useRef<SearchBarCommands | null>(null)
  const blackColor = tw(colors.black.text).color
  const [searchKeyWord, setSearchKeyWord] = React.useState('')

  React.useEffect(() => {
    props.navigation.setOptions({
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
    })

    const unsubscribe = props.navigation.addListener('beforeRemove', () => {
      setSearchKeyWord('')
    })

    return unsubscribe
  }, [props.navigation, blackColor, setSearchKeyWord])

  useMounted(() => {
    setTimeout(() => {
      searchBarRef.current?.focus()
    }, 100)
  })

  return <UpList keyword={searchKeyWord} />
}

export default React.memo(SearchUps)
