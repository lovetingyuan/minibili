import React, { ReactNode } from 'react';
import { Image, Linking, StyleSheet, Text, TextProps } from 'react-native';
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
  const parseEmoji = (text: string) => {
    const result: ReactNode[] = [];

    if (!text) {
      return result;
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
              style={{
                width: props.imageSize,
                height: props.imageSize,
              }}
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
            style={{
              width: props.imageSize,
              height: props.imageSize,
            }}
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
    return <Text style={styles.textContainer}>{parseEmoji(props.text)}</Text>;
  }
  const nodes = [];
  let prev = 0;
  props.text
    // .replace(
    //   /([\u00A0-\u00FF]|[\u0100-\u017F]|[\u0180-\u024F])+/gm,
    //   s => ` ${s} `,
    // )
    .replace(urlregex, (a, b) => {
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
  return <Text style={styles.textContainer}>{nodes}</Text>;
}

const styles = StyleSheet.create({
  link: {
    color: '#008AC5',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
