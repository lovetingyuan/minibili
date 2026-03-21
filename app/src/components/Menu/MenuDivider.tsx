import React from "react";
import { clsx } from "clsx";

import { View } from "react-native";

export interface MenuDividerProps {
  className?: string;
}

export function MenuDivider({ className }: MenuDividerProps) {
  return <View className={clsx("flex-1 border-b-[0.5px] border-black/10", className)} />;
}
