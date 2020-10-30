
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

import { pipe, trim, view } from 'ramda'
import { getMetaLens } from './data'

export const getCurrentPageNumber = state => view(getMetaLens('currentPageNumber'), state)
export const getDocumentsNextToken = state => view(getMetaLens('documentsNextToken'), state)
export const getDocumentsTotal = state => view(getMetaLens('documentsTotal'), state)
export const getSearchQuery = state => view(getMetaLens('searchQuery'), state)
export const getDocumentSearchQuery = state => view(getMetaLens('documentSearchQuery'), state)
export const getCleanSearchQuery = state =>
  pipe(
    view(getMetaLens('searchQuery')),
    trim
  )(state)
export const getSearchPersona = state => view(getMetaLens('searchPersona'), state)
export const getSearchStatus = state => view(getMetaLens('searchStatus'), state)
export const getSearchTotalDocuments = state => view(getMetaLens('searchTotalDocuments'), state)
export const getSearchTotalMatches = state => view(getMetaLens('searchTotalMatches'), state)
export const getKendraQueryId = state => view(getMetaLens('kendraQueryId'), state);
export const getKendraFilteredQueryId = state => view(getMetaLens('kendraFilteredQueryId'), state);
export const getKendraResultCount = state => view(getMetaLens('kendraTotalResults'), state);
export const getKendraFilteredResultCount = state => view(getMetaLens('kendraTotalFilteredResults'), state);
