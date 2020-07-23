import React, { useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import cs from "classnames";
import PropTypes from "prop-types";

import KendraResultPage from "../../components/KendraResultPage/KendraResultPage";
import PersonaSelector from "../PersonaSelector/PersonaSelector";

import { MIN_SEARCH_QUERY_LENGTH } from "../../constants/configs";

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
  filteredResults,
  searchQuery,
  searchStatus,
  searchPersona,
  searchTotalDocuments,
  searchTotalMatches,
  kendraQueryId,
  filteredQueryId,
  resultCount,
  filteredResultCount,
  showPersonaSelector,
  ...rest
}) {
  const dispatch = useDispatch();

  const isQueryLongEnough =
    searchQuery && searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  if (!searchStatus || !searchQuery) return null;

  const hasFilteredResults =
    searchStatus === "success" &&
    filteredResults &&
    searchPersona &&
    showPersonaSelector;

  return (
    <div className={cs(css.base, hasFilteredResults && css.doubleWidth)}>
      <nav {...rest}>
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

        {showPersonaSelector && <PersonaSelector />}
      </nav>

      <div className={css.resultContainer}>
        {searchStatus === "success" && isQueryLongEnough && (
          <KendraResultPage
            title={hasFilteredResults ? "Unfiltered Results" : null}
            results={results}
            queryId={kendraQueryId}
            resultCount={resultCount}
          />
        )}

        {hasFilteredResults ? (
          <KendraResultPage
            title="Filtered Results"
            results={filteredResults}
            queryId={filteredQueryId}
            resultCount={filteredResultCount}
          />
        ) : null}
      </div>
    </div>
  );
}
