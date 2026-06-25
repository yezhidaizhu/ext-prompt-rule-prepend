<script setup lang="ts">
defineProps<{
  active: boolean;
  rotation: number;
}>();
</script>

<template>
  <svg
    class="status-toggle-icon"
    :class="active ? 'is-active' : 'is-inactive'"
    :style="{ transform: `rotate(${rotation}deg)` }"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path class="status-toggle-icon__shape" d="M50 17.18 L88 83 H12 Z" />
    <path class="status-toggle-icon__inner" d="M50 35.03 L70 69.67 H30 Z" />
  </svg>
</template>

<style scoped>
.status-toggle-icon {
  display: block;
  height: 24px;
  width: 24px;
  color: #8b8f98;
  overflow: visible;
  transform-box: fill-box;
  transform-origin: center;
  transition:
    color 180ms ease,
    transform 220ms ease;
}

.status-toggle-icon.is-active {
  color: #10b981;
}

.status-toggle-icon.is-inactive {
  color: #8b8f98;
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
