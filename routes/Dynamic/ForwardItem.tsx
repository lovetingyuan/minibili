import { Icon } from '@rneui/base';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDynamicItems } from '../../services/Bilibili';
import { DynamicType, GetFuncPromiseType } from '../../types';

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
      <Text style={styles.textItem}>{props.text}</Text>
      <View style={styles.forwardContainer}>
        {props.forwardText ? (
          <Text style={{ marginBottom: 8 }} numberOfLines={2}>
            {props.forwardText}
          </Text>
        ) : null}
        <View style={styles.forwardContent}>{forwardContent}</View>
      </View>
      <View style={styles.info}>
        <Icon name="update" color="#666" size={14} />
        <Text style={styles.date}> {props.date}</Text>
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
  forwardContainer: {
    flex: 1,
    marginLeft: 10,
    marginTop: 12,
    paddingLeft: 10,
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
