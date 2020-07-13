import React, { Fragment, useMemo } from "react";

import KendraResultTitle from "../KendraResultTitle/KendraResultTitle";
import KendraHighlightedText from "../KendraHighlightedText/KendraHighlightedText";
import KendraResultFooter from "../KendraResultFooter/KendraResultFooter";

import styles from "./KendraDocumentResults.scss";

export default function KendraDocumentResults({ results, submitFeedback }) {
  const renderedResults = useMemo(
    () =>
      results.map((result) => {
        return (
          <article key={result.id} className={styles.result}>
            <KendraResultTitle
              result={result}
              submitFeedback={submitFeedback}
            />
            <KendraHighlightedText
              textWithHighlights={result.DocumentExcerpt}
            />
            <KendraResultFooter
              result={result}
              submitFeedback={submitFeedback}
            />
          </article>
        );
      }),
    [results, submitFeedback]
  );

  return <div>{renderedResults}</div>;
}
