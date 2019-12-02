import { pipe, trim, view } from 'ramda'
import { getMetaLens } from './data'

export const getCurrentPageNumber = state => view(getMetaLens('currentPageNumber'), state)
export const getDocumentsNextToken = state => view(getMetaLens('documentsNextToken'), state)
export const getDocumentsTotal = state => view(getMetaLens('documentsTotal'), state)
export const getSearchQuery = state => view(getMetaLens('searchQuery'), state)
export const getCleanSearchQuery = state =>
  pipe(
    view(getMetaLens('searchQuery')),
    trim
  )(state)
export const getSearchStatus = state => view(getMetaLens('searchStatus'), state)
export const getSearchTotalDocuments = state => view(getMetaLens('searchTotalDocuments'), state)
export const getSearchTotalMatches = state => view(getMetaLens('searchTotalMatches'), state)
