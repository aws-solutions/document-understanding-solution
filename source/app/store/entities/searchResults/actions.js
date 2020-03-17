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
