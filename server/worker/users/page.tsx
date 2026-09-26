import type { Child } from "hono/jsx";

import type { UserActivity } from "./types";
import usersStyles from "./users.css?inline";

const SITE_URL = "https://minibili.tingyuan.in/";
const DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

interface UsersPageProps {
  users: UserActivity[];
  query: string;
}

interface UsersErrorPageProps {
  title: string;
  message: string;
}

function UsersHead() {
  return (
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="noindex,nofollow" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <title>用户列表 - MiniBili</title>
      <meta name="theme-color" content="#fb7299" />
      <style dangerouslySetInnerHTML={{ __html: usersStyles }}></style>
    </head>
  );
}

function SiteHeader() {
  return (
    <header class="site-header">
      <a class="brand" href={SITE_URL} rel="noreferrer" target="_blank">
        <img class="brand-logo" src="/favicon.svg" alt="" width={28} height={28} />
        <span>MiniBili</span>
      </a>
      <span class="brand-tagline">用户管理</span>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer class="site-footer">
      <span>MiniBili 管理页面</span>
    </footer>
  );
}

function UsersShell(props: { children: Child }) {
  return (
    <html lang="zh-CN">
      <UsersHead />
      <body>
        <div id="users-root">
          <SiteHeader />
          <main class="layout">{props.children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}

function UserTime(props: { timestamp: number }) {
  const date = new Date(props.timestamp);
  return <time datetime={date.toISOString()}>{DATE_FORMATTER.format(date)}</time>;
}

export function UsersPage(props: UsersPageProps) {
  const summary = props.query
    ? `“${props.query}”找到 ${props.users.length} 位用户`
    : `共 ${props.users.length} 位用户`;
  return (
    <UsersShell>
      <section class="toolbar card">
        <div>
          <h1>用户列表</h1>
          <p class="summary">{summary}</p>
        </div>
        <form class="search-form" action="/users" method="get" role="search">
          <label class="sr-only" for="user-search">
            搜索 B站昵称或 UID
          </label>
          <input
            id="user-search"
            name="q"
            type="search"
            value={props.query}
            placeholder="搜索昵称或 UID"
            autocomplete="off"
          />
          <button class="button button-primary" type="submit">
            搜索
          </button>
          {props.query ? (
            <a class="button" href="/users">
              清除
            </a>
          ) : null}
        </form>
      </section>

      {props.users.length ? (
        <section class="table-card card" aria-label="MiniBili 用户列表">
          <table>
            <thead>
              <tr>
                <th scope="col">B站昵称</th>
                <th scope="col">B站 UID</th>
                <th scope="col">首次登录时间</th>
                <th scope="col">最近使用时间</th>
              </tr>
            </thead>
            <tbody>
              {props.users.map((user) => (
                <tr key={user.uid}>
                  <td data-label="B站昵称" class="nickname">
                    {user.nickname}
                  </td>
                  <td data-label="B站 UID">
                    <a
                      class="uid-link"
                      href={`https://space.bilibili.com/${user.uid}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {user.uid}
                    </a>
                  </td>
                  <td data-label="首次登录时间">
                    <UserTime timestamp={user.firstLoginAt} />
                  </td>
                  <td data-label="最近使用时间">
                    <UserTime timestamp={user.lastUsedAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section class="state card">
          <h2>{props.query ? "没有匹配的用户" : "暂无用户"}</h2>
          <p>{props.query ? "请尝试其他昵称或 UID。" : "用户成功同步设置后会显示在这里。"}</p>
        </section>
      )}
    </UsersShell>
  );
}

export function UsersErrorPage(props: UsersErrorPageProps) {
  return (
    <UsersShell>
      <section class="state card">
        <h1>{props.title}</h1>
        <p>{props.message}</p>
      </section>
    </UsersShell>
  );
}
