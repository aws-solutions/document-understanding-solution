import React, { useCallback, useEffect } from "react";
import { connect } from "react-redux";
import cs from 'classnames';

import { getSelectedSearch } from "../../store/ui/selectors";
import { setSelectedSearch } from "../../store/ui/actions";

import styles from './SearchTypeTabs.scss';

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

  useEffect(() => {
    if (selectedSearch !== "both") return;

    function resized() {
      if (window.innerWidth < 1000) {
        setSelectedSearch("es");
      }
    }

    window.addEventListener("resize", resized);

    return () => {
      window.removeEventListener("resize", resized);
    };
  }, [selectedSearch, setSelectedSearch]);

  return (
    <div className={styles.wrapper}>
      <a className={cs(styles.tab, selectedSearch === 'es' && styles.selected)} onClick={selectES}>
        Elasticsearch
        <span>Keyword Search Results</span>
      </a>
      <a className={cs(styles.tab, selectedSearch === 'kendra' && styles.selected)} onClick={selectKendra}>
        Amazon Kendra
        <span>Semantic Search Results</span>
      </a>
      <a className={cs(styles.tab, selectedSearch === 'both' && styles.selected)} onClick={selectBoth}>
        Elasticsearch and Amazon Kendra
        <span>Compare Search Technologies</span>
      </a>
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
