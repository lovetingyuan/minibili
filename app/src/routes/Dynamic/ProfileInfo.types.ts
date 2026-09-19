import type { ReactNode } from "react";

export type ProfileInfoProps = {
  officialDescription?: string;
  sign?: string;
};

export type ProfileInfoRowProps = {
  action?: ReactNode;
  expanded: boolean;
  label: string;
  value: string;
};
