import React, { Fragment, useMemo, useState, useCallback } from "react";

import KendraResultTitle from "../KendraResultTitle/KendraResultTitle";
import KendraHighlightedText from "../KendraHighlightedText/KendraHighlightedText";
import KendraResultFooter from "../KendraResultFooter/KendraResultFooter";

import styles from "./KendraTopResults.scss";

function getTopAnswer(text) {
  if (text && text.Highlights) {
    for (const highlight of text.Highlights) {
      const length = highlight.EndOffset - highlight.BeginOffset;
      if (highlight && highlight.TopAnswer && length < MAX_TOP_ANSWER_LENGTH) {
        return (
          <h1>
            {text.Text.substring(highlight.BeginOffset, highlight.EndOffset)}
          </h1>
        );
      }
    }
  }

  return null;
}

export default function KendraTopResults({ results, submitFeedback }) {
  const renderedResults = useMemo(
    () =>
      results.map((result) => {
        const answer = result.AdditionalAttributes.find(
          (attr) => attr.Key === "AnswerText"
        );

        return (
          <article key={result.id} className={styles.result}>
            <KendraResultTitle
              result={result}
              submitFeedback={submitFeedback}
            />
            {getTopAnswer(answer.TextWithHighlightsValue)}
            <KendraHighlightedText
              textWithHighlights={answer.Value.TextWithHighlightsValue}
            />
            <KendraResultFooter
              result={result}
              submitFeedback={submitFeedback}
            />
          </article>
        );
      }),
    [results]
  );

  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((e) => !e);
  }, []);

  if (!results.length) return null;

  return (
    <div className={styles.topResults}>
      <header>
        <h2>Amazon Kendra Suggested Answers</h2>
      </header>
      <div className={styles.results}>
        {renderedResults[0]}

        {renderedResults.length > 1 ? (
          <>
            <div onClick={toggleExpanded}>
              More suggested answers ({renderedResults.length - 1})
            </div>
            {expanded ? <div>{renderedResults.slice(1)}</div> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
