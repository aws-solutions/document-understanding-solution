import { createAction } from 'redux-actions'

import {
  SET_CURRENT_PAGE_NUMBER,
  SET_DOCUMENTS_NEXT_TOKEN,
  SET_SEARCH_QUERY,
  SET_SEARCH_STATUS,
  CLEAR_SEARCH_QUERY,
} from '../../../constants/action-types'

/**
 * Set the current page number
 */
export const setCurrentPageNumber = createAction(SET_CURRENT_PAGE_NUMBER, currentPageNumber => {
  return { meta: { currentPageNumber } }
})

/**
 * Set the documents next token
 */
export const setDocumentsNextToken = createAction(SET_DOCUMENTS_NEXT_TOKEN, documentsNextToken => {
  return { meta: { documentsNextToken } }
})

/**
 * Set the search query
 */
export const setSearchQuery = createAction(SET_SEARCH_QUERY, searchQuery => {
  return { meta: { searchQuery: searchQuery.replace(/ {2,}/g, ' ') } }
})

/**
 * Clear the search query
 */
export const clearSearchQuery = createAction(CLEAR_SEARCH_QUERY, () => {
  return { meta: { searchQuery: '' } }
})

/**
 * Set the search status
 */
export const setSearchStatus = createAction(SET_SEARCH_STATUS, searchStatus => {
  return { meta: { searchStatus } }
})
