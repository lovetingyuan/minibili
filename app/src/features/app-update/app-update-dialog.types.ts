import type { AvailableAppUpdate } from "@/api/check-update";

export type AppUpdateDialogProps = {
  update: AvailableAppUpdate | null;
  visible: boolean;
  onClose: () => void;
};
