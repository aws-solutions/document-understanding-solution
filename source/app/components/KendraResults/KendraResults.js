import React, { useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import classNames from "classnames";
import Link from "next/link";
import PropTypes from "prop-types";

import Highlight from "../../components/Highlight/Highlight";
import Loading from "../../components/Loading/Loading";
import KendraTopResults from "../../components/KendraTopResults/KendraTopResults";
import KendraDocumentResults from "../../components/KendraDocumentResults/KendraDocumentResults";

import { MIN_SEARCH_QUERY_LENGTH } from "../../constants/configs";
import { makeDocumentLink } from "../../utils/link-generators";

import css from "./KendraResults.scss";
import { submitKendraFeedback } from "../../store/entities/searchResults/actions";

KendraResults.propTypes = {
  className: PropTypes.string,
  results: PropTypes.array,
  searchQuery: PropTypes.string,
  searchStatus: PropTypes.string,
  searchTotalDocuments: PropTypes.number,
  searchTotalMatches: PropTypes.number,
};

KendraResults.defaultProps = {
  results: [],
};

export default function KendraResults({
  className,
  results,
  searchQuery,
  searchStatus,
  searchTotalDocuments,
  searchTotalMatches,
  kendraQueryId,
  ...rest
}) {
  const dispatch = useDispatch();

  const searchResultsClassNames = classNames(css.searchResults, className);
  const isQueryLongEnough =
    searchQuery && searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const topResults = useMemo(
    () => results.filter((res) => res.Type === "ANSWER"),
    [results]
  );
  const docResults = useMemo(
    () => results.filter((res) => res.Type === "DOCUMENT"),
    [results]
  );

  const submitFeedback = useCallback(
    (feedback, item) => {
      dispatch(
        submitKendraFeedback({
          relevance: feedback,
          queryId: kendraQueryId,
          resultId: item.Id,
        })
      );
    },
    [dispatch, kendraQueryId]
  );

  if (!searchStatus || !searchQuery) return null;

  return (
    <nav className={searchResultsClassNames} {...rest}>
      {!isQueryLongEnough && (
        <p className={css.noContent}>
          Enter a search query longer than {MIN_SEARCH_QUERY_LENGTH - 1}{" "}
          characters to initiate a search.
        </p>
      )}

      {/* {!searchTotalDocuments && searchStatus !== 'pending' && (
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
      )}*/}

      <h2>Amazon Kendra Results</h2>

      {searchStatus === "success" && isQueryLongEnough && (
        <>
          <KendraTopResults
            results={topResults}
            submitFeedback={submitFeedback}
          />
          <KendraDocumentResults
            results={docResults}
            submitFeedback={submitFeedback}
          />
        </>
      )}
    </nav>
  );
}
