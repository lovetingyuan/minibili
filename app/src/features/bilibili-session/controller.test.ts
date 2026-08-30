import { describe, expect, test, vi } from "vitest";

import type { BilibiliProfile } from "../../api/bilibili-auth.types";
import { BilibiliSessionChangedError, createBilibiliSession } from "./controller";
import type { BilibiliSessionDependencies } from "./types";

const COOKIE = "SESSDATA=session; DedeUserID=123";
const PROFILE = {
  mid: 123,
  name: "测试用户",
  face: "https://i0.hdslb.com/bfs/face/user.jpg",
  follower: 82,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(initialCookie: string | null = COOKIE) {
  let storedCookie = initialCookie;
  const dependencies = {
    readCookie: vi.fn(async () => storedCookie),
    saveCookie: vi.fn(async (cookie: string) => {
      storedCookie = cookie;
    }),
    clearCookie: vi.fn(async () => {
      storedCookie = null;
    }),
    clearNativeCookies: vi.fn(async () => {}),
    writeWebViewCookies: vi.fn<BilibiliSessionDependencies["writeWebViewCookies"]>(async () => {}),
    validateCookie: vi
      .fn<BilibiliSessionDependencies["validateCookie"]>()
      .mockResolvedValue(PROFILE),
  };
  return {
    dependencies,
    session: createBilibiliSession(dependencies),
    readStored: () => storedCookie,
  };
}

describe("Bilibili session lifecycle", () => {
  test("does not request myinfo without a saved cookie", async () => {
    const { session, dependencies } = setup(null);
    await expect(session.check()).resolves.toBeNull();
    expect(dependencies.validateCookie).not.toHaveBeenCalled();
  });

  test("validates saved credentials before reporting an account", async () => {
    const { session, dependencies } = setup();
    await expect(session.check()).resolves.toEqual({ mid: "123", generation: 0, profile: PROFILE });
    expect(dependencies.validateCookie).toHaveBeenCalledWith(COOKIE);
  });

  test("revalidation updates the profile without changing the session generation", async () => {
    const { session, dependencies } = setup();
    const account = await session.check();
    const profile = {
      ...PROFILE,
      name: "新昵称",
      face: "https://i0.hdslb.com/bfs/face/new.jpg",
      follower: 100,
    };
    dependencies.validateCookie.mockResolvedValue(profile);
    await expect(session.check()).resolves.toEqual({ mid: "123", generation: 0, profile });
    expect(account && session.isCurrentAccount(account)).toBe(true);
  });

  test("invalidates an expired cookie without clearing native or local user data", async () => {
    const { session, dependencies, readStored } = setup();
    const account = await session.check();
    dependencies.validateCookie.mockResolvedValue(null);
    await expect(session.check()).resolves.toBeNull();
    expect(readStored()).toBeNull();
    expect(account && session.isCurrentAccount(account)).toBe(false);
    expect(dependencies.clearNativeCookies).not.toHaveBeenCalled();
  });

  test("does not claim authentication when deleting an expired cookie fails", async () => {
    const { session, dependencies } = setup();
    dependencies.validateCookie.mockResolvedValue(null);
    dependencies.clearCookie.mockRejectedValue(new Error("storage unavailable"));
    await expect(session.check()).resolves.toBeNull();
  });

  test("network failure keeps saved credentials and the previously validated account current", async () => {
    const { session, dependencies, readStored } = setup();
    const account = await session.check();
    dependencies.validateCookie.mockRejectedValue(new Error("offline"));
    await expect(session.check()).rejects.toThrow("offline");
    expect(readStored()).toBe(COOKIE);
    expect(dependencies.clearCookie).not.toHaveBeenCalled();
    expect(account && session.isCurrentAccount(account)).toBe(true);
    expect(account?.profile).toEqual(PROFILE);
  });

  test("never saves a candidate before myinfo succeeds", async () => {
    const { session, dependencies, readStored } = setup(null);
    const validation = deferred<BilibiliProfile | null>();
    dependencies.validateCookie.mockReturnValue(validation.promise);
    const pending = session.login(COOKIE, new AbortController().signal);
    expect(dependencies.saveCookie).not.toHaveBeenCalled();
    validation.resolve(PROFILE);
    await expect(pending).resolves.toEqual({ mid: "123", generation: 1, profile: PROFILE });
    expect(readStored()).toBe(COOKIE);
  });

  test("rejects expired candidates even when both required cookie fields exist", async () => {
    const { session, dependencies } = setup(null);
    dependencies.validateCookie.mockResolvedValue(null);
    await expect(session.login(COOKIE, new AbortController().signal)).resolves.toBeNull();
    expect(dependencies.saveCookie).not.toHaveBeenCalled();
  });

  test("does not publish successful login after storage failure", async () => {
    const { session, dependencies } = setup(null);
    dependencies.saveCookie.mockRejectedValue(new Error("storage unavailable"));
    await expect(session.login(COOKIE, new AbortController().signal)).rejects.toThrow(
      "storage unavailable",
    );
    expect(session.getSnapshot().generation).toBe(0);
  });

  test("cancelling the login page prevents a late validation from saving credentials", async () => {
    const { session, dependencies } = setup(null);
    const validation = deferred<BilibiliProfile | null>();
    dependencies.validateCookie.mockReturnValue(validation.promise);
    const controller = new AbortController();
    const result = expect(session.login(COOKIE, controller.signal)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    controller.abort();
    validation.resolve(PROFILE);
    await result;
    expect(dependencies.saveCookie).not.toHaveBeenCalled();
  });

  test("logout clears native cookies and stored credentials and invalidates account work", async () => {
    const { session, dependencies, readStored } = setup();
    const account = await session.check();
    await session.logout();
    expect(dependencies.clearNativeCookies).toHaveBeenCalledOnce();
    expect(dependencies.clearCookie).toHaveBeenCalledOnce();
    expect(readStored()).toBeNull();
    expect(account && session.isCurrentAccount(account)).toBe(false);
    await expect(session.check()).resolves.toBeNull();
  });

  test("failed logout blocks capture and supports retry without reporting success", async () => {
    const { session, dependencies } = setup();
    dependencies.clearNativeCookies.mockRejectedValueOnce(new Error("native failure"));
    await expect(session.logout()).rejects.toThrow("native failure");
    expect(session.getSnapshot().phase).toBe("logout-error");
    expect(dependencies.clearCookie).not.toHaveBeenCalled();
    await expect(session.login(COOKIE, new AbortController().signal)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    await session.logout();
    expect(session.getSnapshot().phase).toBe("ready");
    await expect(session.check()).resolves.toBeNull();
  });

  test("secure storage cleanup failure also keeps logout blocked until retry", async () => {
    const { session, dependencies } = setup();
    dependencies.clearCookie.mockRejectedValueOnce(new Error("storage failure"));
    await expect(session.logout()).rejects.toThrow("storage failure");
    expect(session.getSnapshot().phase).toBe("logout-error");
    await session.logout();
    expect(session.getSnapshot().phase).toBe("ready");
  });

  test("late session validation cannot restore a logged out account", async () => {
    const { session, dependencies } = setup();
    const started = deferred<void>();
    const validation = deferred<BilibiliProfile | null>();
    dependencies.validateCookie.mockImplementation(() => {
      started.resolve();
      return validation.promise;
    });
    const result = expect(session.check()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    await started.promise;
    await session.logout();
    validation.resolve(PROFILE);
    await result;
    await expect(session.check()).resolves.toBeNull();
  });

  test("late candidate validation cannot save after logout", async () => {
    const { session, dependencies } = setup(null);
    const validation = deferred<BilibiliProfile | null>();
    dependencies.validateCookie.mockReturnValue(validation.promise);
    const result = expect(
      session.login(COOKIE, new AbortController().signal),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    await session.logout();
    validation.resolve(PROFILE);
    await result;
    expect(dependencies.saveCookie).not.toHaveBeenCalled();
  });

  test("logout waits for an already started cookie write and then removes it", async () => {
    const { session, dependencies } = setup(null);
    const started = deferred<void>();
    const saving = deferred<void>();
    dependencies.saveCookie.mockImplementation(() => {
      started.resolve();
      return saving.promise;
    });
    const result = expect(
      session.login(COOKIE, new AbortController().signal),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    await started.promise;
    const logout = session.logout();
    expect(dependencies.clearNativeCookies).not.toHaveBeenCalled();
    saving.resolve();
    await result;
    await logout;
    expect(dependencies.clearCookie).toHaveBeenCalledOnce();
    expect(session.getSnapshot().phase).toBe("ready");
  });

  test.each([null, PROFILE])(
    "a stale validation (%j) cannot replace or delete a new account",
    async (staleProfile) => {
      const { session, dependencies, readStored } = setup();
      const started = deferred<void>();
      const oldValidation = deferred<BilibiliProfile | null>();
      dependencies.validateCookie.mockImplementationOnce(() => {
        started.resolve();
        return oldValidation.promise;
      });
      const result = expect(session.check()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
      await started.promise;
      const nextCookie = "SESSDATA=new; DedeUserID=456";
      const nextProfile = {
        mid: 456,
        name: "另一个用户",
        face: "https://i0.hdslb.com/bfs/face/other.jpg",
        follower: 0,
      };
      dependencies.validateCookie.mockResolvedValue(nextProfile);
      const nextAccount = await session.login(nextCookie, new AbortController().signal);
      expect(nextAccount).toEqual({ mid: "456", generation: 1, profile: nextProfile });
      oldValidation.resolve(staleProfile);
      await result;
      expect(readStored()).toBe(nextCookie);
      expect(dependencies.clearCookie).not.toHaveBeenCalled();
      expect(nextAccount && session.isCurrentAccount(nextAccount)).toBe(true);
      expect(nextAccount?.profile).toEqual(nextProfile);
    },
  );
});

describe("WebView cookie preparation", () => {
  test("uses saved credentials without an API validation request", async () => {
    const { session, dependencies } = setup();
    await session.prepareWebViewCookies(new AbortController().signal);
    expect(dependencies.writeWebViewCookies).toHaveBeenCalledWith(COOKIE);
    expect(dependencies.validateCookie).not.toHaveBeenCalled();
  });

  test.each([null, "", "   "])(
    "skips native writes without saved credentials (%j)",
    async (cookie) => {
      const { session, dependencies } = setup(cookie);
      await session.prepareWebViewCookies(new AbortController().signal);
      expect(dependencies.writeWebViewCookies).not.toHaveBeenCalled();
    },
  );

  test("cancelling before preparation starts skips storage and native writes", async () => {
    const { session, dependencies } = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(session.prepareWebViewCookies(controller.signal)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(dependencies.readCookie).not.toHaveBeenCalled();
    expect(dependencies.writeWebViewCookies).not.toHaveBeenCalled();
  });

  test("unmounting while storage is read prevents late injection", async () => {
    const { session, dependencies } = setup();
    const started = deferred<void>();
    const reading = deferred<string | null>();
    dependencies.readCookie.mockImplementation(() => {
      started.resolve();
      return reading.promise;
    });
    const controller = new AbortController();
    const result = expect(session.prepareWebViewCookies(controller.signal)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    await started.promise;
    controller.abort();
    reading.resolve(COOKIE);
    await result;
    expect(dependencies.writeWebViewCookies).not.toHaveBeenCalled();
  });

  test("logout waits for an in-flight native write even after the page unmounts", async () => {
    const { session, dependencies, readStored } = setup();
    const started = deferred<void>();
    const writing = deferred<void>();
    let nativeCookie: string | null = null;
    dependencies.writeWebViewCookies.mockImplementation(async (cookie) => {
      started.resolve();
      await writing.promise;
      nativeCookie = cookie;
    });
    dependencies.clearNativeCookies.mockImplementation(async () => {
      nativeCookie = null;
    });
    const controller = new AbortController();
    const result = expect(session.prepareWebViewCookies(controller.signal)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    await started.promise;
    const logout = session.logout();
    controller.abort();
    expect(dependencies.clearNativeCookies).not.toHaveBeenCalled();
    writing.resolve();
    await result;
    await logout;
    expect(nativeCookie).toBeNull();
    expect(readStored()).toBeNull();
    await session.prepareWebViewCookies(new AbortController().signal);
    expect(dependencies.writeWebViewCookies).toHaveBeenCalledOnce();
  });

  test("queued preparation cannot inject the previous account after a login", async () => {
    const { session, dependencies } = setup();
    const started = deferred<void>();
    const saving = deferred<void>();
    const saveCookie = dependencies.saveCookie.getMockImplementation();
    dependencies.saveCookie.mockImplementation(async (cookie) => {
      started.resolve();
      await saving.promise;
      await saveCookie?.(cookie);
    });
    const nextCookie = "SESSDATA=new; DedeUserID=456";
    const login = session.login(nextCookie, new AbortController().signal);
    await started.promise;
    const stale = expect(
      session.prepareWebViewCookies(new AbortController().signal),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    saving.resolve();
    await login;
    await stale;
    expect(dependencies.writeWebViewCookies).not.toHaveBeenCalled();
    await session.prepareWebViewCookies(new AbortController().signal);
    expect(dependencies.writeWebViewCookies).toHaveBeenCalledWith(nextCookie);
  });

  test("preparation stays blocked after failed logout until cleanup succeeds", async () => {
    const { session, dependencies } = setup();
    dependencies.clearNativeCookies.mockRejectedValueOnce(new Error("native failure"));
    await expect(session.logout()).rejects.toThrow("native failure");
    await expect(
      session.prepareWebViewCookies(new AbortController().signal),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(dependencies.writeWebViewCookies).not.toHaveBeenCalled();
    await session.logout();
    await session.prepareWebViewCookies(new AbortController().signal);
    expect(dependencies.writeWebViewCookies).not.toHaveBeenCalled();
  });

  test("storage failure leaves preparation retryable", async () => {
    const { session, dependencies } = setup();
    dependencies.readCookie.mockRejectedValueOnce(new Error("storage locked"));
    await expect(session.prepareWebViewCookies(new AbortController().signal)).rejects.toThrow(
      "storage locked",
    );
    expect(dependencies.writeWebViewCookies).not.toHaveBeenCalled();
    await session.prepareWebViewCookies(new AbortController().signal);
    expect(dependencies.writeWebViewCookies).toHaveBeenCalledWith(COOKIE);
  });

  test("native failure leaves preparation retryable and does not block logout", async () => {
    const { session, dependencies } = setup();
    dependencies.writeWebViewCookies.mockRejectedValueOnce(new Error("native failure"));
    await expect(session.prepareWebViewCookies(new AbortController().signal)).rejects.toThrow(
      "native failure",
    );
    await session.prepareWebViewCookies(new AbortController().signal);
    await session.logout();
    expect(dependencies.clearNativeCookies).toHaveBeenCalledOnce();
  });
});
