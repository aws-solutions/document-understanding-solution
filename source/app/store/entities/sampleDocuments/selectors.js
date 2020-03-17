import { values, view } from 'ramda'

import { lensSampleDocuments, lensSampleCollections } from './data'

export const getSampleDocuments = state => values(view(lensSampleDocuments, state))
export const getSampleCollections = state => values(view(lensSampleCollections, state))
