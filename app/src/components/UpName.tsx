import { clsx } from "clsx";
import React from "react";

import { useBilibiliBlacklist } from "@/api/useBilibiliBlacklist";

import { Text } from "./styled/rneui";
import type { UpNameProps } from "./UpName.types";

export default function UpName({ mid, className, ...props }: UpNameProps) {
  const { blacklist } = useBilibiliBlacklist();
  const blocked = mid !== undefined && blacklist.has(String(mid));

  return <Text {...props} className={clsx(className, blocked && "line-through opacity-60")} />;
}
