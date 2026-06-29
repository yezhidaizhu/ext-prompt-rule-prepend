<script setup lang="ts">
defineProps<{
  active: boolean;
  rotation: number;
}>();
</script>

<template>
  <div
    class="status-toggle-icon-wrap"
    :style="{
      '--prp-icon-rotation': `${rotation}deg`,
      transform: `scale(var(--prp-icon-scale, 1)) rotate(${rotation}deg)`,
    }"
  >
    <svg
      class="status-toggle-icon"
      :class="active ? 'is-active' : 'is-inactive'"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path class="status-toggle-icon__shape" d="M50 17.18 L88 83 H12 Z" />
      <path class="status-toggle-icon__inner" d="M50 35.03 L70 69.67 H30 Z" />
    </svg>
  </div>
</template>

<style scoped>
.status-toggle-icon-wrap {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  transform-origin: center;
  transition: transform 160ms ease;
}

.status-toggle-icon {
  display: block;
  height: 24px;
  width: 24px;
  color: var(--prp-icon-muted, #8b8f98);
  overflow: visible;
  transition: color 180ms ease;
}

.prompt-rule-trigger:hover .status-toggle-icon-wrap {
  --prp-icon-scale: 1.08;
}

.status-toggle-icon.is-active {
  color: var(--prp-icon-active, #10b981);
}

.status-toggle-icon.is-inactive {
  color: var(--prp-icon-muted, #8b8f98);
}

.status-toggle-icon__shape {
  fill: none;
  stroke: currentColor;
  stroke-linejoin: round;
  stroke-width: 7;
}

.status-toggle-icon__inner {
  fill: none;
  stroke: currentColor;
  stroke-dasharray: 8 7;
  stroke-linejoin: round;
  stroke-width: 4;
  opacity: 0.72;
}

.status-toggle-icon.is-active .status-toggle-icon__inner {
  opacity: 0.85;
}
</style>
