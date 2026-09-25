import type { ReactNode } from "react";

import type { ProfileInfoLinesField } from "./profile-info.helpers";

export type ProfileInfoProps = {
  officialDescription?: string;
  sign?: string;
};

export type ProfileInfoRowProps = {
  action?: ReactNode;
  field: ProfileInfoLinesField;
  /** 生效后的展开态：超出折叠行数且用户已展开 */
  expanded: boolean;
  label: string;
  onLinesChange: (field: ProfileInfoLinesField, lines: number) => void;
  value: string;
};
