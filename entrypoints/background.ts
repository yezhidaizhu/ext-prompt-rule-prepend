export default defineBackground(() => {
  // Content script 由 WXT 自动注入；此处不再手动 executeScript，避免重复挂载 UI。
});
