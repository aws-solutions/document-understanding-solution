import React from "react";

import KendraResultFeedback from "../KendraResultFeedback/KendraResultFeedback";
import styles from "./KendraResultFooter.scss";

export default function KendraResultFooter({ result, submitFeedback }) {
  return (
    <footer className={styles.footer}>
      <span className={styles.filename}>
        
      </span>
      <KendraResultFeedback result={result} submitFeedback={submitFeedback} />
    </footer>
  );
}
