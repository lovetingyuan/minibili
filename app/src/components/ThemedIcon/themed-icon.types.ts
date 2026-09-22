import type { LucideIcon, LucideProps } from "lucide-react-native";

export type ThemedIconProps = LucideProps & {
  icon: LucideIcon;
  colorClassName?: string;
  filled?: boolean;
};
