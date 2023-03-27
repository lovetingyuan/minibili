(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const e of n)if(e.type==="childList")for(const i of e.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function r(n){const e={};return n.integrity&&(e.integrity=n.integrity),n.referrerpolicy&&(e.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?e.credentials="include":n.crossorigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function t(n){if(n.ep)return;n.ep=!0;const e=r(n);fetch(n.href,e)}})();const s=`<div>
  <img src="\${base}splash.png" class="logo" alt="minibili logo" />
  <h1>MiniBili</h1>
  <button>
    <a href="\${downloadLink}">\u4E0B\u8F7DAPK</a>
  </button>
</div>

<style>
  .logo {
    height: 20em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.vanilla:hover {
    filter: drop-shadow(0 0 2em #3178c6aa);
  }

  .card {
    padding: 2em;
  }

  .read-the-docs {
    color: #888;
  }

  button {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #1a1a1a;
    cursor: pointer;
    transition: border-color 0.25s;
  }
  button:hover {
    border-color: #646cff;
  }
  button:focus,
  button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }

  @media (prefers-color-scheme: light) {
    :root {
      color: #213547;
      background-color: #ffffff;
    }
    a:hover {
      color: #747bff;
    }
    button {
      background-color: #f9f9f9;
    }
  }
</style>
`;function c(l,o){const r=new Function(...Object.keys(o),`return \`${l.trim()}\``);return t=>{const n=r(...Object.values(o));let e;if(typeof t=="string"?e=document.querySelector(t):e=t,e)e.innerHTML=n;else throw new Error("can not find mount container")}}const a=c(s,{downloadLink:"https://expo.dev/artifacts/eas/onu5qRcbURE9dh6DrGaHQT.apk",base:"/minibili/"});a("#app");
