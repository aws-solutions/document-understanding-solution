import React, { Fragment, useRef, useEffect } from 'react'
import { groupWith } from 'ramda'
import cs from 'classnames'

import Button from '../Button/Button'

import css from './RawTextLines.scss'

export default function RawTextLines({
  lines,
  visible,
  pageCount,
  currentPageNumber,
  onSwitchPage,
  onHighlight,
}) {
  const container = useRef()

  useEffect(() => {
    if (visible && container.current) {
      const firstOnThisPage = container.current.querySelector(`.${css.onThisPage}`)
      if (firstOnThisPage) firstOnThisPage.scrollIntoView()
    }
  }, [currentPageNumber, visible])

  if (!lines.length) {
    return <p className={css.empty}>No Key-Value Pairs detected</p>
  }

  return (
    <div className={cs(css.lineList, visible && css.visible)} ref={container}>
      <ul>
        {groupWith((a, b) => a.pageNumber === b.pageNumber)(lines).map((pageLines, i) => (
          <Fragment key={pageLines[0].pageNumber}>
            {pageCount > 1 ? (
              <li
                key={`pn${i}`}
                className={cs(
                  css.pageSeparator,
                  pageLines[0].pageNumber === currentPageNumber && css.onThisPage
                )}
              >
                Page {pageLines[0].pageNumber}
              </li>
            ) : null}
            {pageLines.map(({ id, text, pageNumber, boundingBox }, i) => (
              <li
                key={i}
                className={cs(css.line, pageNumber === currentPageNumber && css.onThisPage)}
                onClick={() => {
                  onHighlight(id)
                }}
              >
                {text}
              </li>
            ))}
          </Fragment>
        ))}
      </ul>

      <footer className={css.actions} />
    </div>
  )
}
