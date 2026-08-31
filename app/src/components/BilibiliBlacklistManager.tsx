import { useEffect, useRef } from "react";

import { useBilibiliBlacklist } from "@/api/useBilibiliBlacklist";
import { showToast } from "@/utils";

export default function BilibiliBlacklistManager() {
  const { error } = useBilibiliBlacklist(true);
  const notified = useRef(false);

  useEffect(() => {
    if (!error) {
      notified.current = false;
    } else if (!notified.current) {
      notified.current = true;
      showToast("B站黑名单同步失败，部分名称可能暂未标记；返回应用时将重试");
    }
  }, [error]);

  return null;
}
