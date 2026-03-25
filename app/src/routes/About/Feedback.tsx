import { Dialog, Input } from "@/components/styled/rneui";
import React from "react";
import { View } from "react-native";

import Modal2 from "@/components/Modal2";
import { colors } from "@/constants/colors.tw";

import { showToast } from "../../utils";
import TextAction from "./TextAction";

export default Feedback;

function Feedback() {
  const [feedBackVisible, setFeedbackVisible] = React.useState(false);
  const modalComponent = Modal2 as unknown as typeof React.Component;
  const hideFeedback = () => {
    setFeedbackVisible(false);
  };
  const showFeedback = () => {
    setFeedbackVisible(true);
  };

  const feedbackRef = React.useRef("");
  const feedbackContactRef = React.useRef("");
  const submitFeedback = () => {
    const message = feedbackRef.current.trim();
    if (message.length === 0) {
      hideFeedback();
      return;
    }
    // TODO: feedback
    // reportUserFeedback(message, feedbackContactRef.current)
    hideFeedback();
    showToast("感谢反馈 😊");
  };

  return (
    <TextAction
      text="💗 欢迎使用本应用"
      buttons={[
        {
          text: "使用反馈",
          onPress: showFeedback,
        },
      ]}
    >
      <Dialog
        isVisible={feedBackVisible}
        onBackdropPress={hideFeedback}
        ModalComponent={modalComponent}
        overlayClassName={colors.gray2.bg}
      >
        <Dialog.Title title="欢迎反馈意见 😊" titleClassName={colors.black.text} />
        <View>
          <Input
            placeholder="填写意见"
            multiline
            autoFocus
            className="mt-5 h-20"
            maxLength={500}
            textAlignVertical="top"
            placeholderTextColorClassName={colors.gray4.accent}
            onChangeText={(value) => (feedbackRef.current = value)}
          />
          <Input
            placeholder="联系方式"
            maxLength={100}
            placeholderTextColorClassName={colors.gray4.accent}
            onChangeText={(value) => (feedbackContactRef.current = value)}
          />
        </View>
        <Dialog.Actions>
          <Dialog.Button title="提交" onPress={submitFeedback} />
          <Dialog.Button title="取消" onPress={hideFeedback} />
        </Dialog.Actions>
      </Dialog>
    </TextAction>
  );
}
