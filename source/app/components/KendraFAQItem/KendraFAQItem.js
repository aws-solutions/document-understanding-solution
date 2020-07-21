import React, { useMemo, useState, useCallback } from "react";
import KendraHighlightedText from "../KendraHighlightedText/KendraHighlightedText";
import KendraResultFooter from "../KendraResultFooter/KendraResultFooter";

import css from './KendraFAQItem.scss';

export default function KendraFAQItem({ item, submitFeedback }) {
  const question = useMemo(
    () => item.AdditionalAttributes.find((att) => att.Key === "QuestionText"),
    [item]
  );
  const answer = useMemo(
    () => item.AdditionalAttributes.find((att) => att.Key === "AnswerText"),
    [item]
  );

  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => setExpanded((e) => !e), []);

  return (
    <div className={css.item}>
      <div className={css.question} onClick={toggleExpanded}>
        <h3>
          <KendraHighlightedText textWithHighlights={question.Value.TextWithHighlightsValue} />
        </h3>
      </div>
      {expanded ? (
        <div className={css.answer}>
          <KendraHighlightedText textWithHighlights={answer.Value.TextWithHighlightsValue} />
          <KendraResultFooter result={item} submitFeedback={submitFeedback} />
        </div>
      ) : null}
    </div>
  );
}
