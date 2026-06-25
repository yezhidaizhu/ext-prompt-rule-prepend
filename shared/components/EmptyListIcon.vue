<template>
  <svg
    class="empty-list-icon"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      class="empty-list-icon__frame"
      x="8"
      y="6"
      width="32"
      height="36"
      rx="5"
    />
    <path
      class="empty-list-icon__row empty-list-icon__row--1"
      d="M14 18 H34"
    />
    <path
      class="empty-list-icon__row empty-list-icon__row--2"
      d="M14 24 H28"
    />
    <path
      class="empty-list-icon__row empty-list-icon__row--3"
      d="M14 30 H31"
    />
    <circle
      class="empty-list-icon__dot"
      cx="24"
      cy="38"
      r="1.6"
    />
  </svg>
</template>

<style scoped>
.empty-list-icon {
  display: block;
  width: 40px;
  height: 40px;
  color: currentColor;
}

.empty-list-icon__frame {
  fill: rgb(255 255 255 / 0.02);
  stroke: currentColor;
  stroke-width: 1.8;
  opacity: 0.5;
}

.empty-list-icon__row {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.empty-list-icon__row--1 {
  opacity: 0.38;
}

.empty-list-icon__row--2 {
  opacity: 0.26;
  stroke-dasharray: 5 4;
}

.empty-list-icon__row--3 {
  opacity: 0.16;
  stroke-dasharray: 4 4;
}

.empty-list-icon__dot {
  fill: currentColor;
  opacity: 0.22;
}
</style>
