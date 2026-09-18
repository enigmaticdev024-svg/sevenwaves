/**
 * Brand palette for the stockist map, transcribed from the `@theme` tokens in
 * `src/app/globals.css` so the map reads as part of the site rather than a
 * Google embed.
 *
 * These are legacy JSON `styles`, applied client-side. That is a deliberate
 * choice over a cloud-configured `mapId`: a `mapId` takes styling over from the
 * Cloud Console and silently ignores this array ("A Map's preregistered map type
 * may not apply all custom styles when a mapId is present"), which would mean the
 * palette lived outside the repo and could not be reviewed in a diff.
 *
 * The cost is that `AdvancedMarkerElement` is unavailable — it requires a mapId —
 * so markers use `google.maps.Marker`. That class is deprecated but explicitly
 * "not scheduled to be discontinued", with at least 12 months' notice promised
 * before removal. To migrate later: set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID, move this
 * palette into a Cloud map style, and swap Marker for AdvancedMarkerElement in
 * StockistMap.
 */

const NAVY = '#232e44'
const CREAM = '#ffecdc'
const SKY = '#a6d5e1'
const TAN = '#baa58c'

export const SEVEN_WAVES_MAP_STYLE: google.maps.MapTypeStyle[] = [
  // Hide the noise: business pins, transit, and Google's own POI labels would
  // compete with our stockist markers.
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  // Land and water.
  { elementType: 'geometry', stylers: [{ color: CREAM }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#fbe4d2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: SKY }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5b93a3' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#cfe3d4' }] },

  // Roads, coarse to fine, so the hierarchy still reads at metro zoom.
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f6d9c2' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f2cdb0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: TAN }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#a8917a' }] },

  // Type: navy at 60-ish contrast, with a cream halo so it stays legible over
  // both the land fill and the roads.
  { elementType: 'labels.text.fill', stylers: [{ color: NAVY }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: CREAM }, { weight: 3 }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d9b79a' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
]

/** Map options shared by the live map and the static fallback. */
export const MAP_OPTIONS: google.maps.MapOptions = {
  styles: SEVEN_WAVES_MAP_STYLE,
  // Requested: no Street View pegman.
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  // Keeps one-finger page scrolling working on touch devices — without this the
  // map swallows the gesture and the page feels stuck.
  gestureHandling: 'cooperative',
}
