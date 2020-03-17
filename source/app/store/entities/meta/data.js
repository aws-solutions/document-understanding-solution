import { lensPath } from 'ramda'

// Meta Lenses
export const getMetaLens = key => lensPath(['entities', 'meta', key])

// Initial Data
export default {
  currentPageNumber: 1,
  documentsNextToken: null,
  documentsTotal: 0,
  searchQuery: '',
  searchStatus: '',
  searchTotalDocuments: 0,
  searchTotalMatches: 0,
}
