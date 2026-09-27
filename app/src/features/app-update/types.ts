export type AppUpdateDownloadInput = {
  downloadUrl: string;
  releaseName: string;
  version: string;
};

export type AppUpdateDownloadStartResult = "started" | "busy" | "unsupported";

export type AppUpdateNotificationContent = {
  title: string;
  body: string;
};
