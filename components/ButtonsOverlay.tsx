import { Button, Overlay } from '@rneui/base';
import React from 'react';
// import { useWindowDimensions } from 'react-native';

export default function ButtonsOverlay(props: {
  visible: boolean;
  buttons: {
    text: string;
    name: string;
  }[];
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
  const Buttons = props.buttons.map(button => {
    return (
      <Button
        type="clear"
        buttonStyle={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          marginVertical: 5,
          ...props.buttonStyle,
        }}
        title={button.text}
        key={button.name}
        onPress={() => {
          props.onPress(button.name);
          props.dismiss();
        }}
      />
    );
  });
  return (
    <Overlay
      isVisible={props.visible}
      overlayStyle={{
        padding: 16,
        backgroundColor: 'white',
        ...props.overlayStyle,
      }}
      onBackdropPress={props.dismiss}>
      {Buttons}
    </Overlay>
  );
}
