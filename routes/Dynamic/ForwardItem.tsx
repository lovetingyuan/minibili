import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import RichText from '../../components/RichText';
import { getDynamicItems } from '../../services/Bilibili';
import { DynamicType, GetFuncPromiseType } from '../../types';
import DateAndOpen from './DateAndOpen';

type DynamicItems = GetFuncPromiseType<typeof getDynamicItems>['items'][0];

type ForwardItems = Extract<
  DynamicItems,
  {
    type:
      | DynamicType.ForwardVideo
      | DynamicType.ForwardDraw
      | DynamicType.ForwardOther;
  }
>;

export default function ForwardItem(props: ForwardItems) {
  let forwardContent = null;
  if (props.type === DynamicType.ForwardVideo) {
    forwardContent = (
      <>
        <Image
          style={styles.forwardContentImage}
          source={{ uri: props.cover + '@240w_240h_1c.webp' }}
        />
        <Text numberOfLines={3} style={{ flex: 6 }}>
          {props.title}
        </Text>
      </>
    );
  } else if (props.type === DynamicType.ForwardDraw) {
    forwardContent = (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={styles.imagesContainer}>
        {props.images.map(img => {
          return (
            <Image
              style={[styles.image, { aspectRatio: img.ratio }]}
              key={img.src}
              source={{ uri: img.src + '@240w_240h_1c.webp' }}
            />
          );
        })}
      </ScrollView>
    );
  } else if (props.type === DynamicType.ForwardOther) {
    forwardContent = <Text>{props.forwardText}</Text>;
  }
  return (
    <View style={[styles.textContainer]}>
      {props.text ? (
        <RichText imageSize={16} text={props.text} />
      ) : // <Text style={styles.textItem}>{parseUrl(props.text)}</Text>
      null}
      <View style={styles.forwardContainer}>
        {props.forwardText ? (
          <Text style={{ marginBottom: 8 }} numberOfLines={2}>
            {props.forwardText}
          </Text>
        ) : null}
        <View style={styles.forwardContent}>{forwardContent}</View>
      </View>
      <DateAndOpen name={props.name} id={props.id} date={props.date} />
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
  forwardContainer: {
    flex: 1,
    marginLeft: 8,
    marginTop: 12,
    paddingLeft: 8,
    borderLeftWidth: 0.5,
    borderLeftColor: '#bbb',
  },
  forwardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  forwardContentImage: {
    width: 150,
    height: 80,
    marginRight: 10,
    flex: 4,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  date: { color: '#555', fontSize: 12 },
  imagesContainer: {},
});
