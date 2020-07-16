
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
