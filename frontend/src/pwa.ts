export function registerIcePwa(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}
