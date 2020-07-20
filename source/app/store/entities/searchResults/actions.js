
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

import { createAction } from "redux-actions";
import { normalize } from "normalizr";
import { API, Auth } from "aws-amplify";

import { SEARCH, CLEAR_SEARCH_RESULTS } from "../../../constants/action-types";
import { searchResultsSchema } from "./data";

/**
 * Get documents from TextractDemoTextractAPI
 */
export const search = createAction(SEARCH, async params => {
  const { data } = await API.get("TextractDemoTextractAPI", "search", {
    headers: {
      Authorization: `Bearer ${(await Auth.currentSession())
        .getIdToken()
        .getJwtToken()}`
    },
    response: true,
    queryStringParameters: { ...params }
  });

  let searchTotalMatches = 0;
  let searchTotalDocuments = 0;
  const results = data.map(result => {
    searchTotalMatches += result.count;
    if (result.count) searchTotalDocuments++;
    return {
      ...result,
      name: result.name.replace(/^.*\//, "")
    };
  });

  const { entities } = normalize(results, searchResultsSchema);
  return { ...entities, meta: { searchTotalMatches, searchTotalDocuments } };
});

/**
 * Clear search results
 */
export const clearSearchResults = createAction(CLEAR_SEARCH_RESULTS, () => ({
  searchResults: [],
  meta: {
    searchTotalMatches: 0,
    searchTotalDocuments: 0
  }
}));
