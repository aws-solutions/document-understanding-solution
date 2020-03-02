import { values, view } from 'ramda'

import { lensSearchResults, lensSearchResult } from './data'

export const getSearchResults = state => values(view(lensSearchResults, state))
export const getSearchResultById = (state, id) => view(lensSearchResult(id), state)
