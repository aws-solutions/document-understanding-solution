
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

import React from 'react'
import classNames from 'classnames'
import Link from 'next/link'
import PropTypes from 'prop-types'

import Highlight from '../../components/Highlight/Highlight'
import Loading from '../../components/Loading/Loading'

import { MIN_SEARCH_QUERY_LENGTH } from '../../constants/configs'
import { makeDocumentLink } from '../../utils/link-generators'

import css from './SearchResults.scss'

SearchResults.propTypes = {
  className: PropTypes.string,
  results: PropTypes.array,
  searchQuery: PropTypes.string,
  searchStatus: PropTypes.string,
  searchTotalDocuments: PropTypes.number,
  searchTotalMatches: PropTypes.number,
}

SearchResults.defaultProps = {
  results: [],
}

export default function SearchResults({
  className,
  results,
  searchQuery,
  searchStatus,
  searchTotalDocuments,
  searchTotalMatches,
  ...rest
}) {
  const searchResultsClassNames = classNames(css.searchResults, className)
  const isQueryLongEnough = searchQuery && searchQuery.length >= MIN_SEARCH_QUERY_LENGTH

  if (!searchStatus || !searchQuery) return null

  return (
    <nav className={searchResultsClassNames} {...rest}>
      {!isQueryLongEnough && (
        <p className={css.noContent}>
          Enter a search query longer than {MIN_SEARCH_QUERY_LENGTH - 1} characters to initiate a
          search.
        </p>
      )}

      {!searchTotalDocuments && searchStatus !== 'pending' && (
        <p className={css.noContent}>No results found.</p>
      )}

      {!!searchTotalDocuments && searchStatus !== 'pending' && (
        <div className={css.searchSummary}>
          {`Found about ${searchTotalMatches} ${
            searchTotalMatches === 1 ? 'result' : 'results'
          } across ${searchTotalDocuments} ${
            searchTotalDocuments === 1 ? 'document' : 'documents'
          }`}
        </div>
      )}

      {searchStatus === 'pending' && isQueryLongEnough && <Loading />}

      {searchStatus === 'success' && isQueryLongEnough && (
        <ul>
          {results.map(({ documentId: id, count, name, lines }) => {
            if (!count) return null
            return (
              <li className={css.resultItem} key={id}>
                <Link {...makeDocumentLink(id)}>
                  <a>
                    <header>
                      <svg
                        height="24"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="m11.9999259 2.01129642v7.35237875.81817933h7.9707628l.0290631 10.8154583c.0014841.5522828-.4450265 1.0011995-.9973092 1.0026836-.0008958.0000024-.0017915.0000036-.0026872.0000036h-13.9997554c-.55228475 0-1-.4477153-1-1v-17.99982331c0-.55228475.44771525-1 1-1 .00052958 0 .00105915.00000042.00158873.00000126zm1.5999851.22400401 5.9122424 6.31019543h-5.9122424z"
                          fillRule="evenodd"
                        />
                      </svg>
                      <h3>{name}</h3>
                      <p className={css.count}>
                        {`About  ${count} `} {count === 1 ? 'match' : 'matches'}
                      </p>
                    </header>
                    <ul className={css.lines}>
                      {lines.slice(0, 4).map((line, i) => (
                        <li key={i}>
                          &hellip;<Highlight search={searchQuery}>{line}</Highlight>&hellip;
                        </li>
                      ))}
                    </ul>
                  </a>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
