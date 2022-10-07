import React from 'react';
import {
  Image,
  Linking,
  // StyleProp,
  StyleSheet,
  Text,
  TextProps,
  // TextStyle,
} from 'react-native';
import urlRegex from 'url-regex';
import emojis from '../utils/emojis';

let index = 0;
const urlregex = urlRegex({
  strict: true,
  // exact: true,
});

export default function RichText(props: {
  text: string;
  imageSize?: number;
  textProps?: TextProps;
}) {
  // const nodes = []
  const parseEmoji = (text: string) => {
    if (!text) {
      return [];
    }
    if (!/\[.+\]/g.test(text)) {
      return [
        <Text {...props.textProps} key={index++}>
          {text}
        </Text>,
      ];
    }
    let normalStr = '';
    let emojiStr = '';
    const result = [];
    let isEmoji = false;

    for (let c of text) {
      if (c === '[') {
        result.push(
          <Text {...props.textProps} key={index++}>
            {normalStr}
          </Text>,
        );
        normalStr = '';
        isEmoji = true;
      } else if (c === ']') {
        isEmoji = false;
        if (emojis[`[${emojiStr}]`]) {
          const { url } = emojis[`[${emojiStr}]`];
          result.push(
            <Image
              key={index++}
              source={{ uri: url }}
              style={{ width: props.imageSize, height: props.imageSize }}
            />,
          );
        } else {
          result.push(
            <Text {...props.textProps} key={index++}>
              {' ' + emojiStr + ' '}
            </Text>,
          );
        }
        emojiStr = '';
      } else {
        if (isEmoji) {
          emojiStr += c;
        } else {
          normalStr += c;
        }
      }
    }
    if (normalStr) {
      result.push(
        <Text {...props.textProps} key={index++}>
          {normalStr}
        </Text>,
      );
    }
    if (emojiStr) {
      if (emojis[`[${emojiStr}]`]) {
        const { url } = emojis[`[${emojiStr}]`];
        result.push(
          <Image
            key={index++}
            source={{ uri: url }}
            style={{ width: props.imageSize, height: props.imageSize }}
          />,
        );
      } else {
        result.push(
          <Text {...props.textProps} key={index++}>
            {' ' + emojiStr + ' '}
          </Text>,
        );
      }
    }
    return result;
  };

  if (!/http(s)?:\/\/.+/.test(props.text)) {
    return <>{parseEmoji(props.text)}</>;
  }
  const nodes = [];
  let prev = 0;
  props.text.replace(urlregex, (a, b) => {
    nodes.push(...parseEmoji(props.text.substring(prev, b)));
    nodes.push(
      <Text
        key={index++}
        style={styles.link}
        onPress={() => {
          Linking.openURL(a);
        }}>
        {a}
      </Text>,
    );
    prev = b + a.length;
    return '';
  });

  nodes.push(...parseEmoji(props.text.substring(prev)));
  return <>{nodes}</>;
}

const styles = StyleSheet.create({
  link: {
    color: '#008AC5',
  },
});
