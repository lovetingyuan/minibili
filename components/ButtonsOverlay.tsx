import { Button, Overlay } from '@rneui/base';
import React from 'react';
import { StyleSheet } from 'react-native';
// import { useWindowDimensions } from 'react-native';

export default function ButtonsOverlay(props: {
  visible: boolean;
  buttons: ({
    text: string;
    name: string;
    longPress?: boolean;
  } | null)[];
  onPress: (name: string) => void;
  overlayStyle?: any;
  buttonStyle?: any;
  dismiss: () => void;
}) {
  // const [modalVisible, setModalVisible] = React.useState(false);
  // React.useEffect(() => {
  //   setModalVisible(props.visible);
  // }, [props.visible]);
  // const { width } = useWindowDimensions();
  const Buttons = props.buttons
    .map(button => {
      if (!button) {
        return null;
      }
      return (
        <Button
          type="clear"
          buttonStyle={[styles.buttonStyle, props.buttonStyle]}
          title={button.text}
          key={button.name}
          {...(button.longPress
            ? {
                onLongPress: () => {
                  props.onPress(button.name);
                  props.dismiss();
                },
              }
            : {
                onPress: () => {
                  props.onPress(button.name);
                  props.dismiss();
                },
              })}
        />
      );
    })
    .filter(Boolean);
  if (!Buttons.length) {
    return null;
  }
  return (
    <Overlay
      isVisible={props.visible}
      overlayStyle={[styles.overlayStyle, props.overlayStyle]}
      onBackdropPress={props.dismiss}>
      {Buttons}
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlayStyle: {
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 24,
    backgroundColor: 'white',
  },
  buttonStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 5,
  },
});
