import { useEffect } from "react";
import useSWR from "swr";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { BilibiliAuthExpiredError } from "../bilibili-session/auth-expiration";
import { UserDataUnauthorizedError } from "./errors";
import { userOpen } from "./user-open";
import type { UserDataAccount } from "./types";

export function useUserOpen(account: UserDataAccount | null) {
  useEffect(() => {
    userOpen.activate(account);
  }, [account]);

  useSWR(
    account ? ["user-open", account.mid, account.generation] : null,
    ([, mid, generation]) => userOpen.record({ mid, generation }),
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: Infinity,
      shouldRetryOnError: (error: Error) =>
        !(
          error instanceof UserDataUnauthorizedError ||
          error instanceof BilibiliAuthExpiredError ||
          error instanceof BilibiliSessionChangedError
        ),
    },
  );
}
