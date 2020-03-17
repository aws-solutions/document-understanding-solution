import { schema } from 'normalizr'
import { lensPath } from 'ramda'

// Track Schemas
export const trackSchema = new schema.Entity('tracks')
export const tracksSchema = new schema.Array(trackSchema)

// Track Lenses
export const lensTracks = lensPath(['entities', 'tracks'])
export const lensTrack = id => lensPath(['entities', 'tracks', id])

// Initial Data
export default {
  search: {
    id: 'search',
    title: 'Discovery',
    subtitle: 'Search across many documents, or within a single document',
    icon: '/static/images/icon_cloud-search.svg',
    palette: 'blue',
  },
  redaction: {
    id: 'redaction',
    title: 'Compliance',
    subtitle: 'Redact information from a document',
    icon: '/static/images/icon_redact.svg',
    palette: 'teal',
  },
  workflow: {
    id: 'workflow',
    title: 'Workflow automation',
    subtitle: 'Edit and transfer data to other tools',
    icon: '/static/images/icon_workflow.svg',
    palette: 'purple',
  },
}
