<template>
  <div class="animate-fade-in">
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; gap: 1rem;">
      <div style="font-size: 4rem; opacity: 0.3;">🔍</div>
      <h1 style="font-size: 1.5rem; color: var(--gray-800); margin: 0;">Halaman Tidak Ditemukan</h1>
      <p style="color: var(--gray-500); font-size: 0.9rem;">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
      <NuxtLink to="/" class="btn btn-primary" style="margin-top: 0.5rem;">
        Kembali ke Dashboard
      </NuxtLink>
    </div>
  </div>
</template>
