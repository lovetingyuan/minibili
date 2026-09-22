import type { ThemedIconProps } from "./themed-icon.types";

import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";

export function ThemedIcon({
  icon: IconComponent,
  color,
  colorClassName = colors.black.text,
  fill,
  filled = false,
  ...props
}: ThemedIconProps) {
  const resolvedColor = useResolvedColor(colorClassName);
  const iconColor = color ?? resolvedColor;
  const iconFill = filled && iconColor !== undefined ? iconColor : (fill ?? "none");

  return <IconComponent {...props} color={iconColor} fill={iconFill} />;
}
