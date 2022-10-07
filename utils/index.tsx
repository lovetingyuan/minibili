import { Image, Linking, StyleSheet, Text } from 'react-native';
import React from 'react';
import urlRegex from 'url-regex';
import emojis from './emojis';

let index = 0;
interface ProcessTextOptions {
  textProps?: any;
  imageSize?: any;
}

const getTextNode = (text: string) =>
  text ? (
    <Text
      selectable
      selectionColor="#BFEDFA"
      textBreakStrategy="balanced"
      key={index++}>
      {text}
    </Text>
  ) : null;
// const getImgNode = (url: string) => (
//   <Image key={index++} source={{ uri: url }} style={styles.emojiImage} />
// );
const getEmojiNode = (text: string, imageSize?: number) => {
  if (emojis[`[${text}]`]) {
    const { url } = emojis[`[${text}]`];
    return (
      <Image
        key={index++}
        source={{ uri: url }}
        style={[
          styles.emojiImage,
          imageSize ? { width: imageSize, height: imageSize } : null,
        ]}
      />
    );
    // return getImgNode(url);
  }
  return (
    <Text key={index++} style={styles.emojiText}>
      {' ' + text + ' '}
    </Text>
  );
};

export const parseEmoji = (msg: string, options: ProcessTextOptions) => {
  if (!msg) {
    return [];
  }
  if (!/\[.+\]/g.test(msg)) {
    return [getTextNode(msg)];
  }
  let normalStr = '';
  let emojiStr = '';
  const result = [];
  let isEmoji = false;

  for (let c of msg) {
    if (c === '[') {
      result.push(getTextNode(normalStr));
      normalStr = '';
      isEmoji = true;
    } else if (c === ']') {
      isEmoji = false;
      result.push(getEmojiNode(emojiStr, options.imageSize));
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
    result.push(getTextNode(normalStr));
  }
  if (emojiStr) {
    result.push(getEmojiNode(emojiStr, options.imageSize));
  }
  return result;
};

const urlregex = urlRegex({
  strict: true,
  // exact: true,
});

export const parseUrl = (text: string, options: ProcessTextOptions) => {
  if (!/http(s)?:\/\/.+/.test(text)) {
    return parseEmoji(text, options);
  }
  const nodes = [];
  let prev = 0;
  text.replace(urlregex, (a, b) => {
    nodes.push(...parseEmoji(text.substring(prev, b), options));
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

  nodes.push(...parseEmoji(text.substring(prev), options));
  return nodes;
};

export const processText = (text: string, options?: ProcessTextOptions) => {
  return parseUrl(text, options || {});
};

const styles = StyleSheet.create({
  emojiText: {
    fontSize: 12,
    color: '#098d3e',
  },
  link: {
    color: '#008AC5',
  },
  emojiImage: { width: 18, height: 18 },
});
