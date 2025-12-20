<template>
  <div class="logo-container">
    <a href="/"><img src="@/assets/images/logo.png" alt="DoraCMS Logo" class="logo-image" /></a>
  </div>
</template>

<script setup>
// Logo component for DoraCMS
</script>

<style scoped>
.logo-container {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo-container:hover {
  transform: scale(1.05);
}

.logo-image {
  height: 28px;
  width: auto;
  object-fit: contain;
}

@media screen and (max-width: 768px) {
  .logo-image {
    height: 32px;
  }
}
</style>
