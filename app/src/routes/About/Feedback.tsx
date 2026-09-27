import { useState } from "react";

import FeedbackDialog from "./FeedbackDialog";
import TextAction from "./TextAction";

export default function Feedback() {
  const [dialogVisible, setDialogVisible] = useState(false);

  return (
    <TextAction
      text="欢迎反馈意见"
      buttons={[
        {
          text: "填写反馈",
          onPress: () => setDialogVisible(true),
        },
      ]}
    >
      {dialogVisible ? <FeedbackDialog onClose={() => setDialogVisible(false)} /> : null}
    </TextAction>
  );
}
