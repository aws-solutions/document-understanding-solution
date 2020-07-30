
/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { createAction } from 'redux-actions'

import {
  SET_CURRENT_PAGE_NUMBER,
  SET_DOCUMENTS_NEXT_TOKEN,
  SET_SEARCH_QUERY,
  SET_SEARCH_STATUS,
  CLEAR_SEARCH_QUERY,
  SET_SEARCH_PERSONA,
  SET_DOCUMENT_SEARCH_QUERY,
  CLEAR_DOCUMENT_SEARCH_QUERY
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
 * Set the search query
 */
export const setDocumentSearchQuery = createAction(SET_DOCUMENT_SEARCH_QUERY, searchQuery => {
  return { meta: { documentSearchQuery: searchQuery.replace(/ {2,}/g, ' ') } }
})

/**
 * Clear the search query
 */
export const clearDocumentSearchQuery = createAction(CLEAR_DOCUMENT_SEARCH_QUERY, () => {
  return { meta: { documentSearchQuery: '' } }
})

/**
 * Set the search status
 */
export const setSearchStatus = createAction(SET_SEARCH_STATUS, searchStatus => {
  return { meta: { searchStatus } }
})

export const setSearchPersona = createAction(SET_SEARCH_PERSONA, persona => {
  return { meta: { searchPersona: persona } }
})
