import type { AppContext } from "../types";

function handleHealth(c: AppContext) {
  return c.json({
    service: "minibili-server",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

export { handleHealth };
