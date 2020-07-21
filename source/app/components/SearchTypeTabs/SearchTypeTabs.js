import React, { useCallback, useEffect, useState, useMemo } from "react";
import { connect } from "react-redux";
import cs from "classnames";

import { getSelectedSearch } from "../../store/ui/selectors";
import { setSelectedSearch } from "../../store/ui/actions";

import styles from "./SearchTypeTabs.scss";

function SearchTypeTabs({ selectedSearch, setSelectedSearch }) {
  const selectES = useCallback(() => {
    setSelectedSearch("es");
  }, [setSelectedSearch]);
  const selectKendra = useCallback(() => {
    setSelectedSearch("kendra");
  }, [setSelectedSearch]);
  const selectBoth = useCallback(() => {
    setSelectedSearch("both");
  }, [setSelectedSearch]);

  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function resized() {
      setWidth(window.innerWidth);
    }

    window.addEventListener("resize", resized);

    return () => {
      window.removeEventListener("resize", resized);
    };
  }, [selectedSearch, setSelectedSearch]);

  const canShowSideBySide = useMemo(() => width >= 1000, [width]);

  useEffect(() => {
    if (selectedSearch === "both" && !canShowSideBySide) {
      setSelectedSearch("es");
    }
  }, [selectedSearch, canShowSideBySide]);

  return (
    <div className={styles.wrapper}>
      <a
        className={cs(styles.tab, selectedSearch === "es" && styles.selected)}
        onClick={selectES}
      >
        Elasticsearch
        <span>Keyword Search Results</span>
      </a>
      <a
        className={cs(
          styles.tab,
          selectedSearch === "kendra" && styles.selected
        )}
        onClick={selectKendra}
      >
        Amazon Kendra
        <span>Semantic Search Results</span>
      </a>
      {canShowSideBySide ? (
        <a
          className={cs(
            styles.tab,
            selectedSearch === "both" && styles.selected
          )}
          onClick={selectBoth}
        >
          Elasticsearch and Amazon Kendra
          <span>Compare Search Technologies</span>
        </a>
      ) : null}
    </div>
  );
}

export default connect(
  function mapStateToProps(state) {
    return {
      selectedSearch: getSelectedSearch(state),
    };
  },
  function mapDispatchToProps(dispatch) {
    return {
      setSelectedSearch: (type) => dispatch(setSelectedSearch(type)),
    };
  }
)(SearchTypeTabs);
