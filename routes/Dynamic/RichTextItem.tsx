import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '@rneui/base';
import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppContext } from '../../context';
import { RootStackParamList } from '../../types';
type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function RichTextItem(props: {
  text: string;
  date: number;
  mid: number;
  name: string;
  images: { src: string; ratio: number }[];
}) {
  const { text, date, mid, images, name } = props;
  const { specialUser } = React.useContext(AppContext);
  const isTracy = mid.toString() === specialUser?.mid;
  const navigation = useNavigation<NavigationProps['navigation']>();

  return (
    <View style={[styles.textContainer]}>
      <Text style={styles.textItem}>{text}</Text>
      {images.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.imagesContainer}>
          {images.map(img => {
            return (
              <Pressable
                key={img.src}
                onPress={() => {
                  Linking.openURL(img.src);
                  navigation.navigate('WebPage', {
                    url: img.src,
                    title: name,
                  });
                }}>
                <Image
                  style={[styles.image, { aspectRatio: img.ratio }]}
                  key={img.src}
                  source={{
                    uri: img.src + (isTracy ? '' : '@240w_240h_1c.webp'),
                  }}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      <View style={styles.info}>
        <Icon name="update" color="#666" size={14} />
        <Text style={styles.date}> {date}</Text>
      </View>
    </View>
  );
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
  },
  textContainer: {
    flex: 1,
  },
  imagesContainer: {
    flex: 1,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  date: { color: '#555', fontSize: 12 },
});
