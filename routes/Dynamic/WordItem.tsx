import { Text } from 'react-native';
import React from 'react';
import { parseUrl } from '../../utils';

export default function WordItem(props: { text: string }) {
  return (
    <Text style={{ fontSize: 16, lineHeight: 26 }}>{parseUrl(props.text)}</Text>
  );
}
