import type { ToastSnapshot } from "./toast.types";

const SHORT_DURATION_MS = 2000;
const LONG_DURATION_MS = 3500;

const listeners = new Set<() => void>();

let currentToast: ToastSnapshot = null;
let nextToastId = 0;
let dismissTimer: ReturnType<typeof setTimeout> | undefined;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function dismissToast(id: number) {
  if (currentToast?.id !== id) {
    return;
  }
  currentToast = null;
  dismissTimer = undefined;
  emitChange();
}

export function enqueueToast(message: string, long: boolean) {
  clearTimeout(dismissTimer);

  const id = ++nextToastId;
  currentToast = { id, message };
  emitChange();

  dismissTimer = setTimeout(() => dismissToast(id), long ? LONG_DURATION_MS : SHORT_DURATION_MS);
}

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return currentToast;
  },
};
