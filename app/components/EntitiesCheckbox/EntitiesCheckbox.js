import React, { Fragment, useRef, useEffect , useMemo, useCallback } from 'react'
import { groupWith } from 'ramda'
import cs from 'classnames'

import Button from '../Button/Button'

import {
  getMultiPageWordsBySearch,
  resetFormsonPage
} from '../../utils/document'

import {
  COMPREHEND_MEDICAL_SERVICE,
  COMPREHEND_SERVICE
} from '../../utils/dus-constants'


import css from './EntitiesCheckbox.scss'

export default function EntitiesCheckbox({
  entities,
  visible,
  pageCount,
  currentPageNumber,
  onSwitchPage,
  onRedact,
  onHighlight,
  showRedaction,
  onRedactAll,
  onDownload,
  comprehendService,
  document
}) {
  const container = useRef()

  useEffect(() => {
    if (visible && container.current) {
      const firstOnThisPage = container.current.querySelector(`.${css.onThisPage}`)
      if (firstOnThisPage) firstOnThisPage.scrollIntoView()
      onHighlight(getMultiPageWordsBySearch(document, currentPageNumber, ['']))
      resetFormsonPage()

    }
  }, [currentPageNumber, visible])
  let is_comprehend_medical = false
  

  if (comprehendService == COMPREHEND_MEDICAL_SERVICE)is_comprehend_medical=true

  
  if (!entities.length) {
    return <p className={css.noEntity}>No {is_comprehend_medical? (`Medical `):null}Entities detected</p>
  }
  return (

    <div className={cs(css.entityList, visible && css.visible,)} ref={container}>
      <ul>
        <h4>{is_comprehend_medical? (`Medical `):null}Entities: {entities.length || 0} Found</h4>
        {groupWith((a, b) => a.pageNumber === b.pageNumber)(entities).map((pairs, i) => (
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
            <form id ={(`${comprehendService}-${i}-form`)}>
            {pairs.map(({ id,  entity, value , pageNumber }, i) => (
              <li
                key={i}
                className={cs(
                  css.ev,
                  pageNumber === currentPageNumber && css.onThisPage,
                  showRedaction && css.hasRedact
                )}
                > 
              <input id={entity} name="entityChoice" type="radio"  onClick={e => {
                  e.stopPropagation()
                  onSwitchPage(pageNumber)
                  onHighlight(getMultiPageWordsBySearch(document, pageNumber, value),pageNumber)
                }
              }/> <label for={entity}>{entity}</label>

                {
                showRedaction ? (
                  <span className = {css.redactSpan}>
                  <a
                    title="Redact Entity Matches"
                    className={css.valueRedact}
                    onClick={e => {
                      e.stopPropagation()
                      onRedact(pageNumber , getMultiPageWordsBySearch(document, pageNumber, value))
                      onSwitchPage(pageNumber)
                    }}
                  >
                    Redact
                  </a></span>
                ) : null}
               
               </li>
  
            ))}</form>

           
           

          </Fragment>
        ))}
      </ul>

      <footer className={css.actions}>
      </footer>
    </div>
  )
}
