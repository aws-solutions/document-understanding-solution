import { handleActions } from 'redux-actions'
import { mergeDeepRight } from 'ramda'

import {
  FETCH_DOCUMENTS,
  FETCH_DOCUMENT,
  REDACT_DOCUMENT,
  SEARCH,
  CLEAR_SEARCH_RESULTS,
  SET_CURRENT_PAGE_NUMBER,
  SET_DOCUMENTS_NEXT_TOKEN,
  SET_SEARCH_QUERY,
  SET_SEARCH_STATUS,
  CLEAR_SEARCH_QUERY,
  HIGHLIGHT_DOCUMENT
} from '../../constants/action-types'

import documents from './documents/data'
import tracks from './tracks/data'
import meta from './meta/data'
import sampleDocuments from './sampleDocuments/data'

export function receiveEntities(state, { payload }) {
  return payload ? mergeDeepRight(state, payload) : state
}

export default handleActions(
  {
    [FETCH_DOCUMENT]: receiveEntities,
    [FETCH_DOCUMENTS]: receiveEntities,
    [REDACT_DOCUMENT]: receiveEntities,
    [HIGHLIGHT_DOCUMENT]: receiveEntities,
    [SEARCH]: receiveEntities,
    [SEARCH]: receiveEntities,
    [CLEAR_SEARCH_RESULTS]: receiveEntities,
    [SET_CURRENT_PAGE_NUMBER]: receiveEntities,
    [SET_DOCUMENTS_NEXT_TOKEN]: receiveEntities,
    [SET_SEARCH_QUERY]: receiveEntities,
    [SET_SEARCH_STATUS]: receiveEntities,
    [CLEAR_SEARCH_QUERY]: receiveEntities,
  },

  // Initial Data
  { documents, tracks, meta, sampleDocuments }
)
