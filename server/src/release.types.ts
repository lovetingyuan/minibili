export interface ReleaseItem {
  changelog: string;
  date: string;
  version: string;
}

export interface ReleasesResponse {
  code: number;
  data: ReleaseItem[];
  message: string;
}
