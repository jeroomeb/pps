import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amenity Op's",
    short_name: "Amenity Op's",
    description: "Amenity Op's — property inspection & audit app",
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f9fa',
    theme_color: '#f8f9fa',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
