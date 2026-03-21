import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();
const releasesUrl =
  "https://tingyuan.in/api/github/releases?user=lovetingyuan&repo=minibili&_t=";

app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/releases", async (c) => {
  const response = await fetch(`${releasesUrl}${Date.now()}`);

  if (!response.ok) {
    return c.json(
      {
        code: response.status,
        message: "Failed to fetch releases",
      },
      response.status,
    );
  }

  const payload = await response.json();
  return c.json(payload);
});

export default app;
