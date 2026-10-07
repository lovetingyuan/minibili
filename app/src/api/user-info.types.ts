import type { UpInfo } from "@/types";

export type UserInfo = UpInfo & {
  level: number;
  sex: string;
  officialDescription: string;
  spacesta?: number;
  silence?: 0 | 1;
};
