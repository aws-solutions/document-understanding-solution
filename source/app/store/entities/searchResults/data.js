import { schema } from 'normalizr'
import { lensPath } from 'ramda'

// Search Result Schemas
export const searchResultSchema = new schema.Entity(
  'searchResults',
  {},
  {
    idAttribute: 'documentId',
  }
)
export const searchResultsSchema = new schema.Array(searchResultSchema)

// Search Result Lenses
export const lensSearchResults = lensPath(['entities', 'searchResults'])
export const lensSearchResult = id => lensPath(['entities', 'searchResults', id])

// Initial Data
export default {}
