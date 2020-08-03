
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

export const kendraResultSchema = new schema.Entity(
  'kendraResults',
  {},
  {
    idAttribute: 'Id',
  }
)
export const kendraResultsSchema = new schema.Array(kendraResultSchema)

export const kendraFilteredResultSchema = new schema.Entity(
  'kendraFilteredResults',
  {},
  {
    idAttribute: 'Id',
  }
)
export const kendraFilteredResultsSchema = new schema.Array(kendraFilteredResultSchema)

// Search Result Lenses
export const lensSearchResults = lensPath(['entities', 'searchResults'])
export const lensSearchResult = id => lensPath(['entities', 'searchResults', id])
export const lensKendraResults = lensPath(['entities', 'kendraResults'])
export const lensKendraFilteredResults = lensPath(['entities', 'kendraFilteredResults'])


// Initial Data
export default {}
