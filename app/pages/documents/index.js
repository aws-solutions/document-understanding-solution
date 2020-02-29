import React, { Fragment, useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { useInView } from 'react-intersection-observer'
import { distanceInWordsToNow, distanceInWords } from 'date-fns'
import Router from "next/router";

import DocumentList from '../../components/DocumentList/DocumentList'
import Loading from '../../components/Loading/Loading'
import Button from '../../components/Button/Button'
import SearchResults from '../../components/SearchResults/SearchResults'

import { fetchDocuments } from '../../store/entities/documents/actions'
import { setDocumentsNextToken } from '../../store/entities/meta/actions'
import {
  getDocumentsNextToken,
  getDocumentsTotal,
  getCleanSearchQuery,
  getSearchStatus,
  getSearchTotalDocuments,
  getSearchTotalMatches,
} from '../../store/entities/meta/selectors'
import { getDocuments } from '../../store/entities/documents/selectors'
import { getSearchResults } from '../../store/entities/searchResults/selectors'
import { getSelectedTrackId } from '../../store/ui/selectors'

import { makeDocumentLink } from '../../utils/link-generators'

import css from './documents.scss'
import SearchBar from '../../components/SearchBar/SearchBar'

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
    pageTitle: 'Your uploaded documents',
  }
}

function Documents({
  documents,
  documentsNextToken,
  documentsTotal,
  dispatch,
  searchQuery,
  searchResults,
  searchStatus,
  searchTotalDocuments,
  searchTotalMatches,
  track,
}) {
  const [sentinelRef, isSentinelVisible] = useInView({ threshold: 1 })
  const { status } = useFetchDocuments({
    dispatch,
    nextToken: documentsNextToken,
    isSentinelVisible,
  })

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

  return (
    <div className={css.documents}>
      <div className={introClassNames}>
        <Button link={{ href: '/select' }}>+ Add a new Document</Button>
        <SearchBar className={css.searchBar} />
      </div>

      {status === 'pending' && !files.length && <Loading />}
      {(status === 'success' || !!files.length) && !searchQuery && (
        <Fragment>
          {!!files.length && (
            <div className={listDetailsClassNames}>
              <p>
                Showing {files.length} of {documentsTotal} document{documentsTotal !== 1 && 's'}
              </p>
            </div>
          )}
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

      <SearchResults
        results={searchResults}
        searchStatus={searchStatus}
        searchQuery={searchQuery}
        searchTotalDocuments={searchTotalDocuments}
        searchTotalMatches={searchTotalMatches}
      />
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
    searchResults: getSearchResults(state),
    searchTotalDocuments: getSearchTotalDocuments(state),
    searchTotalMatches: getSearchTotalMatches(state),
    track: getSelectedTrackId(state),
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
