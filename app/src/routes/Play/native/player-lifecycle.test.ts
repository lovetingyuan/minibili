import { describe, expect, test } from "vitest";

import {
  configureBackgroundPlayback,
  readPlayerSnapshot,
  resolvePlayerSynchronization,
} from "./player-lifecycle";

type TestPlayer = {
  showNowPlayingNotification: boolean;
  staysActiveInBackground: boolean;
};

function createPlayer(): TestPlayer {
  return {
    showNowPlayingNotification: false,
    staysActiveInBackground: false,
  };
}

describe("background playback configuration", () => {
  test("does not touch service-starting properties while the app is inactive", () => {
    let writes = 0;
    const values = createPlayer();
    const player = {
      get staysActiveInBackground() {
        return values.staysActiveInBackground;
      },
      set staysActiveInBackground(value: boolean) {
        writes += 1;
        values.staysActiveInBackground = value;
      },
      get showNowPlayingNotification() {
        return values.showNowPlayingNotification;
      },
      set showNowPlayingNotification(value: boolean) {
        writes += 1;
        values.showNowPlayingNotification = value;
      },
    };

    expect(configureBackgroundPlayback(player, true, "background")).toBe("deferred");
    expect(writes).toBe(0);
  });

  test("enables both background properties while active", () => {
    const player = createPlayer();

    expect(configureBackgroundPlayback(player, true, "active")).toBe("applied");
    expect(player).toEqual({
      showNowPlayingNotification: true,
      staysActiveInBackground: true,
    });
  });

  test("contains a native setter failure and rolls back to a safe state", () => {
    const values = createPlayer();
    const player = {
      get staysActiveInBackground() {
        return values.staysActiveInBackground;
      },
      set staysActiveInBackground(value: boolean) {
        if (value) {
          throw new Error("service start rejected");
        }
        values.staysActiveInBackground = false;
      },
      get showNowPlayingNotification() {
        return values.showNowPlayingNotification;
      },
      set showNowPlayingNotification(value: boolean) {
        values.showNowPlayingNotification = value;
      },
    };

    expect(configureBackgroundPlayback(player, true, "active")).toBe("failed");
    expect(values).toEqual({
      showNowPlayingNotification: false,
      staysActiveInBackground: false,
    });
  });

  test("can retry a rejected configuration after the app is active again", () => {
    let reject = true;
    const values = createPlayer();
    const player = {
      get staysActiveInBackground() {
        return values.staysActiveInBackground;
      },
      set staysActiveInBackground(value: boolean) {
        if (value && reject) {
          throw new Error("service start rejected");
        }
        values.staysActiveInBackground = value;
      },
      get showNowPlayingNotification() {
        return values.showNowPlayingNotification;
      },
      set showNowPlayingNotification(value: boolean) {
        values.showNowPlayingNotification = value;
      },
    };

    expect(configureBackgroundPlayback(player, true, "active")).toBe("failed");
    reject = false;
    expect(configureBackgroundPlayback(player, true, "active")).toBe("applied");
    expect(values).toEqual({
      showNowPlayingNotification: true,
      staysActiveInBackground: true,
    });
  });

  test("reads the authoritative native playback snapshot", () => {
    expect(
      readPlayerSnapshot({
        currentTime: 12.3456,
        playing: true,
        status: "readyToPlay",
      }),
    ).toEqual({
      currentTimeMs: 12_346,
      isPlaying: true,
      status: "readyToPlay",
    });
  });

  test("uses the foreground native time to repair playback UI and danmaku", () => {
    expect(
      resolvePlayerSynchronization(
        {
          currentTime: 270.125,
          playing: true,
          status: "readyToPlay",
        },
        true,
      ),
    ).toEqual({
      currentTimeMs: 270_125,
      danmakuAnchorMs: 270_125,
      isPlaying: true,
      status: "readyToPlay",
    });
  });
});
