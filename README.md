# Prompt Rule Prepend

给没有自定义指令的平台加一层可管理的「规则列表」。

目标：发送前自动拼接预设规则，减少废话，保持回答简洁、准确、结构化。

## 当前阶段

- 先做独立 Vue 组件调试页。
- 暂不把 UI 注入真实网站。
- 平台不写死 DeepSeek，通过 presets 配置。
- DeepSeek 只是默认示例平台。

## UI 设计

- 组件放在聊天输入框 textarea 前面。
- 三角按钮表示状态：
  - 绿色正三角：已启用。
  - 灰色倒三角：已禁用。
- 点击三角只打开弹窗，不直接切换启用状态。
- 弹窗向上打开，包含：
  - 启用开关。
  - 预设 prompt 输入框。
  - 保存按钮。

默认 prompt：

```txt
请用简洁、准确、结构化的方式回答，避免无关铺垫。
```

## 本地调试

安装依赖：

```bash
pnpm install
```

启动组件调试页：

```bash
pnpm dev:ui
```

打开：

```txt
http://127.0.0.1:5173
```

扩展开发：

```bash
pnpm dev
```

类型检查：

```bash
pnpm compile
```

## 平台配置

配置在 `config/platforms.ts`。

每个平台包含：

- `id`：平台标识。
- `name`：平台名称。
- `matches`：content script 匹配域名。
- `inputSelector`：聊天输入框选择器。
- `submitSelector`：发送按钮选择器。
- `conversationContainerSelector`：对话列表/内容容器选择器，容器为空时才显示三角按钮并允许首轮拼接规则。
- `insertStrategy`：规则注入策略。

当前内置：

- DeepSeek：`*://chat.deepseek.com/*`

## 后续注入方案

真实网站注入时只匹配配置白名单。

发送前处理流程：

1. 找到当前平台 preset。
2. 找到输入框和发送按钮。
3. 用户点击发送时，如果规则已启用：
   - 不长期污染用户输入框。
   - 发送前拼接预设规则。
   - 后续可把规则渲染成可折叠 DOM 标记，视觉上更清楚。

## 依赖原则

- Tailwind 4：样式。
- `@floating-ui/vue`：弹窗定位、边界处理、滚动容器处理。
- 新增复杂库前先确认，不闭门造车。
