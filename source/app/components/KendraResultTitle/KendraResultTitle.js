import React, { useCallback } from "react";

import LinkWithClickHandler from "../LinkWithClickHandler/LinkWithClickHandler";

import KendraHighlightedText from "../KendraHighlightedText/KendraHighlightedText";

import styles from "./KendraResultTitle.scss";
import { makeDocumentLink } from "../../utils/link-generators";

export default function KendraResultTitle({ result, submitFeedback }) {
  let resultTitle;

  if (result.DocumentTitle && result.DocumentTitle.Text) {
    resultTitle = (
      <KendraHighlightedText textWithHighlights={result.DocumentTitle} />
    );
  } else if (result.DocumentURI) {
    resultTitle = result.DocumentURI;
  }

  const handleClick = useCallback(() => {
    submitFeedback("CLICK", result);
  }, [submitFeedback, result]);

  if (!resultTitle) return null;

  const uri = result.DocumentURI;

  // TODO link to doc

  return (
    <header className={styles.header}>
      <LinkWithClickHandler
        {...makeDocumentLink(result.DocumentId)}
        onClick={handleClick}
      >
        <h3 className={styles.title}>{resultTitle}</h3>
      </LinkWithClickHandler>
    </header>
  );
}
