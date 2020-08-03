
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

import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { connect, useDispatch } from 'react-redux'
import { useInView } from 'react-intersection-observer'
import { distanceInWordsToNow, distanceInWords } from 'date-fns'
import Router from "next/router";
import { reject, isNil } from 'ramda'

import {
  clearSearchQuery,
  setSearchQuery,
  setSearchStatus,
} from '../../store/entities/meta/actions'
import { search, clearSearchResults } from '../../store/entities/searchResults/actions'

import { MIN_SEARCH_QUERY_LENGTH, ENABLE_KENDRA } from '../../constants/configs'

import DocumentList from '../../components/DocumentList/DocumentList'
import Loading from '../../components/Loading/Loading'
import Button from '../../components/Button/Button'
import SearchResults from '../../components/SearchResults/SearchResults'
import KendraResults from '../../components/KendraResults/KendraResults'
import SearchTypeTabs from '../../components/SearchTypeTabs/SearchTypeTabs'

import { fetchDocuments } from '../../store/entities/documents/actions'
import { setDocumentsNextToken } from '../../store/entities/meta/actions'
import {
  getDocumentsNextToken,
  getDocumentsTotal,
  getCleanSearchQuery,
  getSearchStatus,
  getSearchTotalDocuments,
  getSearchTotalMatches,
  getSearchPersona,
  getKendraQueryId,
  getKendraFilteredQueryId,
  getKendraResultCount,
  getKendraFilteredResultCount,
} from '../../store/entities/meta/selectors'
import { getDocuments } from '../../store/entities/documents/selectors'
import { getSearchResults, getKendraResults, getKendraFilteredResults } from '../../store/entities/searchResults/selectors'
import { getSelectedTrackId, getSelectedSearch } from '../../store/ui/selectors'

import { makeDocumentLink } from '../../utils/link-generators'

import css from './documents.scss'
import SearchBar from '../../components/SearchBar/SearchBar'
import { setHeaderProps } from '../../store/ui/actions'
import Link from 'next/link'

Documents.propTypes = {
  dispatch: PropTypes.func,
  documents: PropTypes.array,
  documentsNextToken: PropTypes.string,
  documentsTotal: PropTypes.number,
  searchQuery: PropTypes.string,
  searchResults: PropTypes.array,
  searchStatus: PropTypes.string,
  searchTotalDocuments: PropTypes.number,
  searchTotalMatches: PropTypes.number,
  track: PropTypes.string,
}

Documents.defaultProps = {
  documents: [],
}

Documents.getInitialProps = function() {
  return {
    showNavigation: true
  }
}

function Documents({
  documents,
  documentsNextToken,
  documentsTotal,
  dispatch,
  searchQuery,
  searchPersona,
  searchResults,
  kendraResults,
  kendraFilteredResults,
  searchStatus,
  searchTotalDocuments,
  searchTotalMatches,
  kendraQueryId,
  kendraFilteredQueryId,
  kendraResultCount,
  kendraFilteredResultCount,
  track,
  selectedSearch
}) {
  const [sentinelRef, isSentinelVisible] = useInView({ threshold: 1 })
  const { status } = useFetchDocuments({
    dispatch,
    nextToken: documentsNextToken,
    isSentinelVisible,
  })


  const doSearch = useSearchCallback(dispatch, searchPersona)

  useEffect(() => {
    doSearch(searchQuery)
  }, [ searchQuery, doSearch ]);

  let files = documents.map(
    ({ documentId, documentName, documentStatus, documentCreatedOn, documentCompletedOn }) => {
      const uploadedTime = distanceInWordsToNow(`${documentCreatedOn}Z`, { addSuffix: true })
      const processedTime =
        documentCompletedOn && distanceInWords(`${documentCreatedOn}Z`, `${documentCompletedOn}Z`)
      return {
        id: documentId,
        title: documentName,
        link: makeDocumentLink(documentId),
        documentStatus : documentStatus,
        uploadedTime,
        processedTime,
      }
    }
  )

  const listDetailsClassNames = classNames(css.listDetails)
  const introClassNames = classNames(css.intro)

  useEffect(() => {
    dispatch(setHeaderProps({
      showNavigation: !!searchQuery
    }))

    return () => {
      dispatch(setHeaderProps({
        showNavigation: true
      }))
    }
  }, [ searchQuery ])

  if (documentsTotal === 0 && status === 'success') {
    return (
      <div className={css.documents}>
        <p className="noContent">
          No documents found. <br />
          <Button link={{ href: '/select' }}>+ Add a new Document</Button>
        </p>
      </div>
    )
  }

  const isQueryLongEnough = searchQuery && searchQuery.length >= MIN_SEARCH_QUERY_LENGTH

  return (
    <div className={css.documents}>
      <div className={introClassNames}>
        {!searchQuery && <p>
          Search through documents to find the information you are looking for
        </p>}
        <SearchBar
          className={css.searchBar}
          light
          suggestions={ENABLE_KENDRA && searchQuery && [
            'What are the testing guidelines for COVID-19?',
            'How to prevent transmission of COVID-19',
            'What is the recommended treatment for COVID-19?'
          ]}
          placeholder={ENABLE_KENDRA ? 'Type a Natural Language Query related to COVID-19' : null}
        />
      </div>

      {status === 'pending' && !files.length && <Loading />}
      {(status === 'success' || !!files.length) && !searchQuery && (
        <Fragment>
          <div className={listDetailsClassNames}>
            <p className={css.instructions}>Analyze a document from the list of documents below, or <Link href="/select"><a>upload your own documents</a></Link>.</p>

            {!!files.length && (
              <p className={css.fileCount}>
                Showing {files.length} of {documentsTotal} document{documentsTotal !== 1 && 's'}
              </p>
            )}
          </div>
          <DocumentList items={files} className={css.list} />
          {status === 'pending' && !!files.length && (
            <Loading size={64} overlay={false} className={css.loadingItems} />
          )}
          {status === 'success' && documentsNextToken && (
            <div ref={sentinelRef} className={css.sentinel} />
          )}
        </Fragment>
      )}

      {status === 'error' && (
        <p className="noContent">Something went wrong, please refresh the page to try again.</p>
      )}

      {searchQuery && <>

        <div>
          { ENABLE_KENDRA ?
            <SearchTypeTabs />
          : null }
          <div className={css.searchResultContainer}>
            { !ENABLE_KENDRA || selectedSearch === 'es' || selectedSearch === 'both' ?
              <SearchResults
                results={searchResults}
                searchStatus={searchStatus}
                searchQuery={searchQuery}
                searchTotalDocuments={searchTotalDocuments}
                searchTotalMatches={searchTotalMatches}
                isComparing={selectedSearch === 'both'}
              />
            : null }

            { ENABLE_KENDRA && (selectedSearch === 'kendra' || selectedSearch === 'both') ?
              <KendraResults
                results={kendraResults}
                filteredResults={kendraFilteredResults}
                searchStatus={searchStatus}
                searchQuery={searchQuery}
                kendraQueryId={kendraQueryId}
                filteredQueryId={kendraFilteredQueryId}
                resultCount={kendraResultCount}
                filteredResultCount={kendraFilteredResultCount}
                searchPersona={searchPersona}
                showPersonaSelector={selectedSearch === 'kendra'}
                isComparing={selectedSearch === 'both'}
              />
            : null }

            {searchStatus === 'pending' && isQueryLongEnough && <Loading />}

          </div>
        </div>
      </> }
    </div>
  )
}

export default connect(function mapStateToProps(state) {
  return {
    documents: getDocuments(state),
    documentsNextToken: getDocumentsNextToken(state),
    documentsTotal: getDocumentsTotal(state),
    searchQuery: getCleanSearchQuery(state),
    searchStatus: getSearchStatus(state),
    searchPersona: getSearchPersona(state),
    searchResults: getSearchResults(state),
    kendraResults: getKendraResults(state),
    kendraFilteredResults: getKendraFilteredResults(state),
    searchTotalDocuments: getSearchTotalDocuments(state),
    searchTotalMatches: getSearchTotalMatches(state),
    kendraQueryId: getKendraQueryId(state),
    kendraFilteredQueryId: getKendraFilteredQueryId(state),
    kendraResultCount: getKendraResultCount(state),
    kendraFilteredResultCount: getKendraFilteredResultCount(state),
    track: getSelectedTrackId(state),
    selectedSearch: getSelectedSearch(state)
  }
})(Documents)

/**
 * Conditionally fetch documents.
 *
 * @param {Function} dispatch Redux dispatch function
 * @param {String} nextToken Indicates that there are more documents available to fetch
 * @param {Boolean} isSentinelVisible Is the window scrolled to the end of the list and the are more docs to fetch
 * @return {Object} Returns an object with the current fetch status
 */
function useFetchDocuments({ dispatch, nextToken, isSentinelVisible }) {
  const isMounted = useRef(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!status) dispatch(setDocumentsNextToken(null))
    const isFirstFetch = !!(!nextToken && !status)
    const isReadyToFetchMore = !!(nextToken && isSentinelVisible && status === 'success')

    if (isReadyToFetchMore || isFirstFetch) {
      setStatus('pending')

      // Immediately clear the nextToken until we hear back from the fetch.
      // The response may or may not include a new nextToken.
      nextToken && dispatch(setDocumentsNextToken(null))

      // Fetch documents
      dispatch(fetchDocuments({ nextToken }))
        .then(() => {
          isMounted.current && setStatus('success')
        })
        .catch(() => {
          isMounted.current && setStatus('error')
        })
    }
  }, [dispatch, nextToken, isSentinelVisible, status])

  // Ensure we don't try to set state after component unmount
  useEffect(() => () => (isMounted.current = false), [])

  return { status }
}



/**
 * Create a throttled search handler.
 * Search query must be greater than or equal to MIN_SEARCH_QUERY_LENGTH.
 *
 * @param {Function} dispatch Redux dispatch function
 * @return {Function} Returns a search handler
 */
function useSearchCallback(dispatch, persona) {
  const isMounted = useRef(true)


  // Ensure we don't try to set state after component unmount
  useEffect(() => () => (isMounted.current = false), [])

  const handleSearchChange = useCallback(
    (k) => {
      if (k && k.length >= MIN_SEARCH_QUERY_LENGTH) {
        dispatch(setSearchStatus('pending'))
        const params = reject(isNil, { k, persona })

        // Clear out old search results
        dispatch(clearSearchResults())

        // Search documents
        dispatch(search(params))
          .then(() => {
            isMounted.current && dispatch(setSearchStatus('success'))
          })
          .catch((err) => {
            console.log(err);
            isMounted.current && dispatch(setSearchStatus('error'))
          })
      }
    },
    [dispatch, persona]
  )

  return handleSearchChange
}
