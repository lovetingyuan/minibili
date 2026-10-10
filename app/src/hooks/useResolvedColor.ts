import { useResolveClassNames } from "uniwind";

export default function useResolvedColor(className?: string) {
  const styles = useResolveClassNames(className ?? "");

  if (typeof styles.accentColor === "string") {
    return styles.accentColor;
  }
  if (typeof styles.color === "string") {
    return styles.color;
  }

  if (typeof styles.backgroundColor === "string") {
    return styles.backgroundColor;
  }

  if (typeof styles.borderColor === "string") {
    return styles.borderColor;
  }

  return undefined;
}
