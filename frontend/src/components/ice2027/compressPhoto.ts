const MAX_EDGE = 1280
const JPEG_QUALITY = 0.58
const SKIP_BYTES = 180 * 1024

function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Picture could not be read.'))
    }
    image.src = url
  })
}

function release(image: ImageBitmap | HTMLImageElement) {
  if ('close' in image) {
    image.close()
  }
}

/** Shrink phone photos before upload so several pictures finish quickly. */
export async function compressPhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file
  }
  try {
    const image = await loadImage(file)
    const srcW = image.width || 0
    const srcH = image.height || 0
    if (srcW < 1 || srcH < 1) {
      release(image)
      return file
    }
    const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH))
    if (file.size <= SKIP_BYTES && scale >= 1) {
      release(image)
      return file
    }
    const width = Math.max(1, Math.round(srcW * scale))
    const height = Math.max(1, Math.round(srcH * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) {
      release(image)
      return file
    }
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    release(image)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob || blob.size < 1 || (blob.size >= file.size && scale >= 1)) {
      return file
    }
    const base = (file.name || 'photo').replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}
