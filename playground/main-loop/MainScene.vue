<template>
  <div class="ml-scene" aria-hidden="true">
    <slot />
  </div>
</template>

<style scoped>
.ml-scene {
  position: relative;
  flex: 1;
  min-height: 0;
}
</style>
