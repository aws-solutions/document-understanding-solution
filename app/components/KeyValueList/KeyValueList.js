import React, { Fragment, useRef, useEffect } from 'react'
import { groupWith } from 'ramda'
import cs from 'classnames'

import Button from '../../components/Button/Button'

import css from './KeyValueList.scss'

export default function KeyValueList({
  kvPairs,
  visible,
  pageCount,
  currentPageNumber,
  onSwitchPage,
  onRedact,
  onHighlight,
  showRedaction,
  onRedactAll,
  onDownload,
}) {
  const container = useRef()

  useEffect(() => {
    if (visible && container.current) {
      const firstOnThisPage = container.current.querySelector(`.${css.onThisPage}`)
      if (firstOnThisPage) firstOnThisPage.scrollIntoView()
    }
  }, [currentPageNumber, visible])

  if (!kvPairs.length) {
    return <p className={css.noKv}>No Key-Value Pairs detected</p>
  }

  return (
    <div className={cs(css.kvList, visible && css.visible)} ref={container}>
      <ul>
        <h4>Key-Value Pairs</h4>
        {groupWith((a, b) => a.pageNumber === b.pageNumber)(kvPairs).map((pairs, i) => (
          <Fragment key={pairs[0].pageNumber}>
            {pageCount > 1 ? (
              <li
                key={`pn${i}`}
                className={cs(
                  css.pageSeparator,
                  pairs[0].pageNumber === currentPageNumber && css.onThisPage
                )}
              >
                Page {pairs[0].pageNumber}
              </li>
            ) : null}
            {pairs.map(({ id, key, value, pageNumber, keyBoundingBox, valueBoundingBox }, i) => (
              <li
                key={i}
                className={cs(
                  css.kv,
                  pageNumber === currentPageNumber && css.onThisPage,
                  showRedaction && css.hasRedact
                )}
                onClick={() => {
                  onHighlight(id)
                  onSwitchPage(pageNumber)
                }}
              >
                <h5>{key}</h5>
                <p>{(value && String(value).trim()) || <em>no value</em>} </p>
                {showRedaction ? (
                  <a
                    title="Redact this value"
                    className={css.valueRedact}
                    onClick={e => {
                      e.stopPropagation()
                      onRedact(valueBoundingBox, pageNumber)
                      onSwitchPage(pageNumber)
                    }}
                  >
                    Redact
                  </a>
                ) : null}
              </li>
            ))}
          </Fragment>
        ))}
      </ul>

      <footer className={css.actions}>
        {showRedaction ? (
          <Button className={css.redactButton} onClick={onRedactAll}>
            Redact All Values
          </Button>
        ) : (
          <Button className={css.downloadButton} onClick={onDownload}>
            Download CSV
          </Button>
        )}
      </footer>
    </div>
  )
}
