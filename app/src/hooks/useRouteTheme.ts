import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useCSSVariable, useUniwind } from "uniwind";

export default function useRouteTheme() {
  const { theme } = useUniwind();
  const base = theme === "dark" ? DarkTheme : DefaultTheme;
  const [primary, background, card, text, border, notification] = useCSSVariable([
    "--color-primary",
    "--color-page",
    "--color-surface",
    "--color-foreground",
    "--color-divider",
    "--color-secondary-solid",
  ]);

  return {
    ...base,
    colors: {
      primary: resolveColor(primary, base.colors.primary),
      background: resolveColor(background, base.colors.background),
      card: resolveColor(card, base.colors.card),
      text: resolveColor(text, base.colors.text),
      border: resolveColor(border, base.colors.border),
      notification: resolveColor(notification, base.colors.notification),
    },
  };
}

function resolveColor(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}
