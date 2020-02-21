import React, { Fragment, useRef, useEffect , useMemo, useCallback } from 'react'
import { groupWith } from 'ramda'
import cs from 'classnames'

import css from '../EntitiesCheckbox/EntitiesCheckbox.scss'


export default function DocumentPreview({
  pageCount,
  visible,
  document
}) {
  const container = useRef()

  useEffect(() => {
    if (visible && container.current) {
      const firstOnThisPage = container.current.querySelector(`.${css.onThisPage}`)
      if (firstOnThisPage) firstOnThisPage.scrollIntoView()
    }
  }, [ visible])
  
  
  return (
    <div className={cs(css.entityList, visible && css.visible,)} ref={container}>
      <ul>
        <h4>Document Details</h4>
          <Fragment >
            <p> File Name : {document.documentName}</p>
            <p> Total pages : {pageCount}</p>
          </Fragment>
      </ul>

      <footer className={css.actions}>
      </footer>
    </div>
  )
}
