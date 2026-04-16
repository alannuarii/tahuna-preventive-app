<template>
  <div class="app-wrapper">
    <AppHeader />
    <main class="app-content">
      <div class="container">
        <slot />
      </div>
    </main>
    <AppMenu />
    <!-- Portal target for overlays (camera, modals) that need to escape overflow containers -->
    <div id="teleports"></div>
  </div>
</template>
