import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import cs from "classnames";
import PropTypes from "prop-types";

import Joyride, { STATUS } from 'react-joyride'

import KendraResultPage from "../../components/KendraResultPage/KendraResultPage";
import PersonaSelector from "../PersonaSelector/PersonaSelector";

import { MIN_SEARCH_QUERY_LENGTH } from "../../constants/configs";

import css from "./KendraResults.scss";
import { submitKendraFeedback } from "../../store/entities/searchResults/actions";
import { dismissWalkthrough } from "../../store/ui/actions";
import { getHasDismissedWalkthrough } from "../../store/ui/selectors";

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



const WALKTHROUGH_STEPS = [
  {
    target: '[data-walkthrough="top-result"]',
    title: 'Amazon Kendra suggested answers',
    content: 'When you type a question, Kendra uses machine learning algorithms to understand the context and return the most relevant results, whether that be a precise answer or an entire document. Kendra will map to the relevant documents and return a specific answer.',
    disableBeacon: true,
    placement: 'top'
  },
  {
    target: '[data-walkthrough="faq"]',
    title: 'Frequently asked questions',
    content: 'You can upload a list of FAQs to Kendra to provide direct answers to common questions your end users are asking. Kendra will find the closest question to the search query and return the corresponding answer.',
    disableBeacon: true,
    placement: 'top'
  },
  {
    target: '[data-walkthrough="feedback"]',
    title: 'Promote',
    content: 'Kendra supports boosting documents based on a vote or view count.',
    disableBeacon: true,
    placement: 'top'
  }
];




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


  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function resized() {
      setWidth(window.innerWidth);
    }

    window.addEventListener("resize", resized);

    return () => {
      window.removeEventListener("resize", resized);
    };
  }, []);

  const canShowSideBySide = useMemo(() => width >= 1000, [width]);

  const hasDismissedWalkthrough = useSelector(getHasDismissedWalkthrough);

  const [ walkthroughRunning, setWalkthroughRunning ] = useState(false);
  useEffect(() => {
    if (!hasDismissedWalkthrough) setWalkthroughRunning(true);
  }, [])

  const walkthroughCallback = useCallback(data => {
    if ([ STATUS.FINISHED, STATUS.SKIPPED ].includes(data.status)) {
      dispatch(dismissWalkthrough());
      setWalkthroughRunning(false);
    }
  }, [ dispatch ]);



  return (
    <div className={cs(css.base, hasFilteredResults && css.doubleWidth)}>
      <Joyride
        steps={WALKTHROUGH_STEPS}
        run={walkthroughRunning}
        callback={walkthroughCallback}
        continuous
        showSkipButton
        locale={{ last: 'Finish' }}
        styles={{
          options: {
            backgroundColor: '#545b64',
            arrowColor: '#545b64',
            textColor: '#fff',
            primaryColor: '#f6761d'
          }
        }}
      />
      <nav {...rest} className={css.topNav}>
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
        {searchStatus === "success" && isQueryLongEnough && (!hasFilteredResults || canShowSideBySide) && (
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
            persona={searchPersona}
          />
        ) : null}
      </div>
    </div>
  );
}
