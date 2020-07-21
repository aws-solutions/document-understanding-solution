import React from "react";
import KendraFAQItem from "../KendraFAQItem/KendraFAQItem";

import css from "./KendraFAQs.scss";

export default function KendraFAQs({ results, submitFeedback }) {
  if (!results.length) return null;

  return (
    <div className={css.faqs}>
      <header>
        <h2>Frequently asked questions</h2>
      </header>
      {results.map((item) => (
        <KendraFAQItem
          item={item}
          key={item.Id}
          submitFeedback={submitFeedback}
        />
      ))}
    </div>
  );
}
