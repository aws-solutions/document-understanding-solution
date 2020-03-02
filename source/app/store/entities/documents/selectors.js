import { values, view, sortBy, prop, reverse, filter, complement } from 'ramda'

import { lensDocument, lensDocuments } from './data'

export const getDocuments = state =>
  reverse(
    sortBy(prop('documentCreatedOn'))(
      filter(complement(prop('deleted')), values(view(lensDocuments, state)))
    )
  )
export const getDocumentById = (state, id) => view(lensDocument(id), state)
