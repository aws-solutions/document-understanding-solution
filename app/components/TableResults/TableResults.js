import React, { Fragment, useRef, useEffect , useMemo, useCallback } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import cs from 'classnames'

import { groupWith } from 'ramda'

import css from './TableResults.scss'


export default function TableResults({
  tables,
  visible,
  pageCount,
  currentPageNumber,
  onSwitchPage,
  onHighlight,
  onDownload,
  document
}) {
  const container = useRef()

  useEffect(() => {
    if (visible && container.current) {
      const firstOnThisPage = container.current.querySelector(`.${css.onThisPage}`)
      if (firstOnThisPage) firstOnThisPage.scrollIntoView()
    }
  }, [currentPageNumber, visible])


  if (!tables.length) {
    return <p className={css.noTable}>No Tables detected</p>
  }
  console.log(pageCount)
  return (

    <div className={cs(css.tableList, visible && css.visible,)} ref={container}>
      <ul>
        <h4>Tables: {tables.length || 0} Found</h4>
        {groupWith((a, b) => a.pageNumber === b.pageNumber)(tables).map((pairs, i) => (
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
            
    
               {pairs.map(({ table,pageNumber ,rows }, i) => (
              <li
                key={i}
                className={cs(
                  css.ev,
                  pageNumber === currentPageNumber && css.onThisPage
                )}
                onClick={() => {
                  onSwitchPage(pageNumber)
                }}
              >
                <h5>Table {i+1} : {rows.length || 0} rows</h5>
                
              </li>
            ))}
  
         

           
           

          </Fragment>
        ))}
      </ul>

      <footer className={css.actions}>
      </footer>
    </div>
  )


}


