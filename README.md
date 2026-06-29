# AI Prompt Rule Assistant

A browser extension for managing reusable prompt rules and appending them to AI chat messages before sending.

The extension is built with WXT, Vue 3, Pinia, Tailwind CSS 4, and Floating UI.

## What It Does

- Manage prompt rules from the extension popup.
- Enable or disable each rule.
- Assign rules to specific platforms.
- Copy, preview, edit, and delete rules.
- Configure platform selectors, default rules, and trigger position.
- Show a small in-page trigger near the chat input.
- Append the active rule before the message is sent.
- Avoid duplicate injection when the message already contains a `<RULES>` block.
- Auto-enable injection for a new conversation and disable it after injection or once a conversation starts.
- Store configuration in extension storage with a localStorage mirror fallback.

## Current Platform Support

The content script currently targets:

- DeepSeek: `*://chat.deepseek.com/*`
- ChatGPT: `*://chatgpt.com/*`
- Kimi: `*://www.kimi.com/*`

The popup data model also contains configurable entries for Claude, but the shipped content-script preset and host permission currently do not include Claude. To enable more platforms, update:

- `config/platforms.ts`
- `wxt.config.ts`
- the platform selectors in the popup or defaults

## Injection Format

When injection is active, the extension appends the rule to the user's message:

```txt
User message
<RULES> --------
Rule content
-------- </RULES>
```

If the message already contains `<RULES>`, it is left unchanged.

## Popup Features

### Rules

- Create a new rule.
- Toggle a rule on or off.
- Assign a rule to one or more platforms.
- Preview long rules.
- Copy rule content.
- Edit or delete existing rules.

### Platforms

Each platform can be configured with:

- name
- match URL
- enabled state
- default rule
- input selector
- submit button selector
- conversation container selector
- conversation item selector
- trigger X/Y offset

### Settings

- Trigger visibility:
  - `newConversationOnly`
  - `always`
  - `hidden`
- UI theme:
  - `auto`
  - `black`
  - `white`

## In-Page Trigger

The in-page trigger opens a small rule panel. From there, the user can:

- enable or disable injection
- select a platform rule
- add a rule for the current platform
- edit the active rule

The trigger uses a green upward triangle when active and a gray downward triangle when inactive.

## Development

Install dependencies:

```bash
pnpm install
```

Run the extension in development mode:

```bash
pnpm dev
```

Run the standalone UI preview:

```bash
pnpm dev:ui
```

Open:

```txt
http://127.0.0.1:5173
```

Type check:

```bash
pnpm compile
```

Build:

```bash
pnpm build
```

Package:

```bash
pnpm zip
```

## Notes

- The current default prompt rules are Chinese.
- The extension uses DOM selectors, so platform UI changes may require selector updates.
- `visible-folded-rule` exists as a planned insert strategy, but the current active behavior is `append-before-send`.
