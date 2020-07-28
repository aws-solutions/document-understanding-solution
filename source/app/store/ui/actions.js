
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
import { set } from 'ramda'

import { SET_SELECTED_TRACK, SET_HEADER_PROPS, SET_SELECTED_SEARCH, DISMISS_WALKTHROUGH } from '../../constants/action-types.js'
import { lensSelectedTrack, lensHeaderProps, lensSelectedSearch, lensDismissedWalkthrough } from './data'

export const setSelectedTrack = createAction(SET_SELECTED_TRACK, selectedTrack => {
  localStorage.setItem('track', selectedTrack)
  return set(lensSelectedTrack, selectedTrack, {})
})

export const setHeaderProps = createAction(SET_HEADER_PROPS, props =>
  set(lensHeaderProps, props, {})
)

export const setSelectedSearch = createAction(SET_SELECTED_SEARCH, searchType =>
  set(lensSelectedSearch, searchType, {})
)

export const dismissWalkthrough = createAction(DISMISS_WALKTHROUGH, () => {
  localStorage.setItem('dismissedWalkthrough', 1);
  return set(lensDismissedWalkthrough, true, {})
})
