import React, { Fragment, useRef, useEffect , useMemo, useCallback } from 'react'
import { groupWith } from 'ramda'
import cs from 'classnames'

import Button from '../Button/Button'
import css from './DocumentPreview.scss'


export default function DocumentPreview({
  pageCount,
  visible,
  track,
  document
}) {
  const container = useRef()

  useEffect(() => {
    if (visible && container.current) {
      const firstOnThisPage = container.current.querySelector(`.${css.onThisPage}`)
      if (firstOnThisPage) firstOnThisPage.scrollIntoView()
    }
  }, [ visible])
  
<<<<<<< HEAD:source/app/components/DocumentPreview/DocumentPreview.js
  console.log(document.searchablePdfURL)
=======
>>>>>>> 56a1bfc97f54ee47329d14b50bb986d7f1345231:app/components/DocumentPreview/DocumentPreview.js
        
  return (
     <div className={cs(css.entityList, visible && css.visible)} ref={container}>
      <ul>
        <h4>File Details</h4>
          <Fragment key={document.documentName}>
           <h5>Name : {document.documentName}</h5>
           <h5>Total Page: {pageCount}</h5>
          </Fragment>
      
    
      </ul>
    
        <footer className={css.actions}>
            {track === 'search' ? (
                  <div className={css.downloadButtons}>
                  <Button link={{ download: 'searchable-pdf.pdf' }} 
                  href={document.searchablePdfURL}>
                    ⬇ Searchable PDF
                  </Button>
                </div>) : null}

                <div className={css.downloadButtons}>
              <Button
                inverted
                link={{ download: document.documentName.split('/').pop()  } } 
                href={document.documentURL}
                
              >
                ⬇ Original Doc
              </Button>
            </div>

        </footer>
    </div>
  )
}
