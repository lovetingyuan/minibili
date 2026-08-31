import type { ComponentProps } from "react";

import type { Text } from "./styled/rneui";

export type UpNameProps = ComponentProps<typeof Text> & {
  mid: string | number | undefined;
};
