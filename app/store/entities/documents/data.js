import { schema } from 'normalizr'
import { lensPath } from 'ramda'

// Document Schemas
export const documentSchema = new schema.Entity(
  'documents',
  {},
  {
    idAttribute: 'documentId',
  }
)
export const documentsSchema = new schema.Array(documentSchema)

// Document Lenses
export const lensDocuments = lensPath(['entities', 'documents'])
export const lensDocument = id => lensPath(['entities', 'documents', id])

// Initial Data
export default {}
