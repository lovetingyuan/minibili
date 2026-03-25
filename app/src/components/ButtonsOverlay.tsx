import { Button, Overlay } from "@/components/styled/rneui";
import React from "react";

import { colors } from "@/constants/colors.tw";

import { useStore } from "../store";
import Modal2 from "./Modal2";

function ButtonsOverlay() {
  const { overlayButtons, setOverlayButtons } = useStore();
  const dismiss = () => {
    setOverlayButtons([]);
  };
  const Buttons = overlayButtons
    .map((button) => {
      if (!button) {
        return null;
      }
      return (
        <Button
          type="clear"
          buttonClassName="w-full justify-start px-5 py-2.5"
          titleClassName="w-full text-left"
          title={button.text}
          key={button.text}
          onPress={() => {
            dismiss();
            button.onPress();
          }}
        />
      );
    })
    .filter(Boolean);

  if (!Buttons.length) {
    return null;
  }
  return (
    <Overlay
      isVisible={overlayButtons.length > 0}
      ModalComponent={Modal2 as unknown as typeof React.Component}
      overlayClassName={`w-[80%] max-w-[500px] px-0 py-3 ${colors.gray2.bg}`}
      onBackdropPress={dismiss}
    >
      {Buttons}
    </Overlay>
  );
}

export default ButtonsOverlay;
