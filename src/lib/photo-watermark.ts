/**
 * Amenity Ops Photo Timestamp & Senior QA Audit Overlay Engine
 *
 * Implements Point 10 of the Client Review:
 * Permanently stamps timestamp, inspection ID, item name, and optional GPS coordinates
 * directly into the image canvas pixels before storage upload.
 */

export type WatermarkOptions = {
  inspectionId: string
  itemName?: string
  date?: Date
  gpsCoordinates?: { latitude: number; longitude: number } | null
}

/**
 * Attempts to retrieve GPS coordinates with a rapid timeout (1.5s max)
 * so as not to introduce latency into the mobile inspector workflow.
 */
export async function getQuickCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    let resolved = false
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    }, 1500)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
        }
      },
      () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve(null)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 1500,
        maximumAge: 60000,
      }
    )
  })
}

/**
 * Loads a File into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

/**
 * Stamped audit trail photo generator.
 * Stamping occurs client-side in the inspector's browser on the canvas.
 */
export async function stampPhotoWithAuditTrail(
  file: File,
  options: WatermarkOptions
): Promise<File> {
  // If running in SSR or canvas unsupported, return file unchanged
  if (typeof window === 'undefined') {
    return file
  }

  try {
    const img = await loadImage(file)

    // Bound maximum canvas dimension to 1280px to optimize mobile upload speed and memory
    let targetWidth = img.naturalWidth || img.width
    let targetHeight = img.naturalHeight || img.height
    const maxDim = 1280

    if (targetWidth > maxDim || targetHeight > maxDim) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDim) / targetWidth)
        targetWidth = maxDim
      } else {
        targetWidth = Math.round((targetWidth * maxDim) / targetHeight)
        targetHeight = maxDim
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return file
    }

    // 1. Draw base photo
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

    // 2. Prepare Stamp Metadata
    const timestamp = options.date ?? new Date()
    const dateStr = timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })

    const inspSnippet = options.inspectionId ? options.inspectionId.slice(0, 8).toUpperCase() : 'AUDIT'
    const itemSnippet = options.itemName ? options.itemName.trim() : 'Item'

    const lines: string[] = [
      `AMENITY OPS • QA AUDIT VERIFIED`,
      `DATE: ${dateStr}`,
      `INSP: #${inspSnippet} • ${itemSnippet}`,
    ]

    if (options.gpsCoordinates) {
      const lat = options.gpsCoordinates.latitude.toFixed(5)
      const lon = options.gpsCoordinates.longitude.toFixed(5)
      lines.push(`GPS: ${lat}, ${lon}`)
    }

    // 3. Calculate dynamic typography scaled to photo size
    const baseFontSize = Math.max(13, Math.round(targetWidth * 0.016))
    const lineHeight = Math.round(baseFontSize * 1.35)
    const padding = Math.round(baseFontSize * 0.8)

    ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

    // Measure maximum line width
    let maxTextWidth = 0
    for (const line of lines) {
      const metrics = ctx.measureText(line)
      if (metrics.width > maxTextWidth) {
        maxTextWidth = metrics.width
      }
    }

    const badgeWidth = maxTextWidth + padding * 2
    const badgeHeight = lines.length * lineHeight + padding * 2
    const badgeX = targetWidth - badgeWidth - padding
    const badgeY = targetHeight - badgeHeight - padding
    const radius = Math.max(4, Math.round(baseFontSize * 0.4))

    // 4. Draw rounded translucent dark badge
    ctx.save()
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)' // Slate-900 with high opacity
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.moveTo(badgeX + radius, badgeY)
    ctx.lineTo(badgeX + badgeWidth - radius, badgeY)
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius)
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius)
    ctx.quadraticCurveTo(
      badgeX + badgeWidth,
      badgeY + badgeHeight,
      badgeX + badgeWidth - radius,
      badgeY + badgeHeight
    )
    ctx.lineTo(badgeX + radius, badgeY + badgeHeight)
    ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius)
    ctx.lineTo(badgeX, badgeY + radius)
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 5. Render stamped text lines
    lines.forEach((line, i) => {
      const textY = badgeY + padding + (i + 1) * lineHeight - Math.round(lineHeight * 0.25)
      if (i === 0) {
        // Highlight title
        ctx.fillStyle = '#ee8a4b' // Brand primary orange accent
        ctx.font = `700 ${Math.round(baseFontSize * 1.05)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      } else {
        ctx.fillStyle = '#ffffff'
        ctx.font = `500 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      }
      ctx.fillText(line, badgeX + padding, textY)
    })

    ctx.restore()

    // 6. Export as JPEG blob & return as File
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const stampedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(stampedFile)
        },
        'image/jpeg',
        0.78
      )
    })
  } catch (err) {
    console.error('Failed to stamp photo watermark:', err)
    return file // Fallback to raw file so photo capture is never blocked
  }
}
