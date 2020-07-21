import React, { useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";

import KendraTopResults from "../../components/KendraTopResults/KendraTopResults";
import KendraDocumentResults from "../../components/KendraDocumentResults/KendraDocumentResults";

import { submitKendraFeedback } from "../../store/entities/searchResults/actions";

import styles from "./KendraResultPage.scss";
import KendraFAQs from "../KendraFAQs/KendraFAQs";

KendraResultPage.propTypes = {
  className: PropTypes.string,
  results: PropTypes.array,
  searchQuery: PropTypes.string,
  searchStatus: PropTypes.string,
  searchTotalDocuments: PropTypes.number,
  searchTotalMatches: PropTypes.number,
};

KendraResultPage.defaultProps = {
  results: [],
};

export default function KendraResultPage({ title, results, queryId }) {
  const dispatch = useDispatch();

  const topResults = useMemo(
    () => results.filter((res) => res.Type === "ANSWER"),
    [results]
  );
  const faqResults = useMemo(
    () => results.filter((res) => res.Type === "QUESTION_ANSWER"),
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
          queryId: queryId,
          resultId: item.Id,
        })
      );
    },
    [dispatch, queryId]
  );

  return (
    <div className={styles.resultList}>
      {title && <h3>{title}</h3>}
      <KendraTopResults results={topResults} submitFeedback={submitFeedback} />
      <KendraFAQs results={faqResults} submitFeedback={submitFeedback} />
      <KendraDocumentResults
        results={docResults}
        submitFeedback={submitFeedback}
      />
    </div>
  );
}
