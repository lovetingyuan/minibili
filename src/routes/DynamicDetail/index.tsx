import React from 'react'
import {
  View,
  // Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import RichText from '../../components/RichText'
import CommentList from '../Play/CommentList'

type Props = NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>

const DynamicDetail: React.FC<Props> = ({ navigation, route }) => {
  return (
    <View style={{ flex: 1 }}>
      <RichText
        text={route.params.text}
        imageSize={16}
        textProps={{ style: { fontSize: 16, lineHeight: 25 } }}
      />
      {route.params.images.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          {route.params.images.map(img => {
            return (
              <Pressable
                key={img.src}
                // onPress={() => {
                //   Linking.openURL(img.src)
                // }}
              >
                <Image
                  style={[styles.image, { aspectRatio: img.ratio }]}
                  key={img.src}
                  source={{
                    uri: img.src + '@240w_240h_1c.webp',
                  }}
                />
              </Pressable>
            )
          })}
        </ScrollView>
      ) : null}
      <View style={{ flex: 1 }}>
        <ScrollView>
          <CommentList
            upName={route.params.name}
            commentId={route.params.commentId}
            commentType={route.params.commentType}
          />
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    height: 120,
    marginRight: 20,
    marginVertical: 10,
  },
  textContainer: {
    flex: 1,
  },
  // imagesContainer: {
  //   flex: 1,
  // },
})
export default DynamicDetail
