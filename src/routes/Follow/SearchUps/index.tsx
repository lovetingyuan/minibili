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
  const [searchingUpsKeyWord, setSearchingUpsKeyWord] = React.useState('')

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
          setSearchingUpsKeyWord('')
        },
        onSearchButtonPress: ({ nativeEvent: { text } }) => {
          const keyword = text.trim()
          if (!keyword) {
            return
          }
          setSearchingUpsKeyWord(keyword)
        },
      },
    })

    const unsubscribe = props.navigation.addListener('beforeRemove', () => {
      setSearchingUpsKeyWord('')
    })

    return unsubscribe
  }, [props.navigation, blackColor, setSearchingUpsKeyWord])

  useMounted(() => {
    setTimeout(() => {
      searchBarRef.current?.focus()
    }, 100)
  })

  return <UpList keyword={searchingUpsKeyWord} />
}

export default React.memo(SearchUps)
