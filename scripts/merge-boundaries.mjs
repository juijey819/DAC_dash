import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const directory = new URL('../public/data/geo/', import.meta.url)
const files = readdirSync(directory).filter(file => file.endsWith('.json')).sort()
const features = files.flatMap(file => {
  const local = new URL(file, directory)
  const source = JSON.parse(readFileSync(local, 'utf8').replace(/^\uFEFF/, ''))
  if (source.type !== 'FeatureCollection') throw new Error('Unexpected data in ' + file)
  return source.features.map(({ properties, geometry }) => {
    if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) throw new Error('Invalid geometry in ' + file)
    const coordinates = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
    return {
      type: 'Feature',
      properties: { name: properties.PROVINSI, code: properties.KODE_PROV },
      geometry: { type: 'MultiPolygon', coordinates },
    }
  })
})
if (features.length !== 38 || new Set(features.map(feature => feature.properties.code)).size !== 38) {
  throw new Error('Expected 38 unique province codes.')
}
writeFileSync(new URL('../public/data/indonesia-provinces.geojson', import.meta.url), JSON.stringify({
  type: 'FeatureCollection',
  features,
}) + '\n')
