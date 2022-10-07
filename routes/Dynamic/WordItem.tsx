import React from 'react';
import { View } from 'react-native';
import RichText from '../../components/RichText';
import DateAndOpen from './DateAndOpen';

export default function WordItem(props: {
  date: string;
  id: string;
  text: string;
  name: string;
}) {
  return (
    <View>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      <DateAndOpen name={props.name} id={props.id} date={props.date} />
    </View>
  );
}
