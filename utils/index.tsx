import { Linking, StyleSheet, Text } from 'react-native';
import React from 'react';

export const parseEmoji = (msg: string) => {
  if (!/\[.+\]/g.test(msg)) {
    return msg;
  }
  let normalStr = '';
  let emojiStr = '';
  const result = [];
  let isEmoji = false;
  let i = 0;
  for (let c of msg) {
    i++;
    if (c === '[') {
      result.push(normalStr);
      normalStr = '';
      isEmoji = true;
    } else if (c === ']') {
      isEmoji = false;
      result.push(
        <Text key={emojiStr + i} style={styles.emojiText}>
          {' ' + emojiStr + ' '}
        </Text>,
      );
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
    result.push(normalStr);
  }
  if (emojiStr) {
    result.push(
      <Text key={emojiStr + i} style={styles.emojiText}>
        {' ' + emojiStr + ' '}
      </Text>,
    );
  }
  return result;
};
import urlRegex from 'url-regex';

const urlregex = urlRegex({
  strict: true,
  // exact: true,
});

export const parseUrl = (text: string) => {
  if (!/http(s)?:\/\/.+/.test(text)) {
    return parseEmoji(text);
  }
  const nodes = [];
  let prev = 0;
  text.replace(urlregex, (a, b) => {
    nodes.push(...parseEmoji(text.substring(prev, b)));
    // nodes.push(<Text key={nodes.length}>{text.substring(prev, b)}</Text>);
    nodes.push(
      <Text
        key={nodes.length}
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
  nodes.push(...parseEmoji(text.substring(prev)));
  return nodes;
};

const styles = StyleSheet.create({
  emojiText: {
    fontSize: 12,
    color: '#098d3e',
  },
  link: {
    color: '#008AC5',
  },
});
