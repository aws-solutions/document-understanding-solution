
/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import React, { Fragment, useCallback, useState, useEffect, useRef, forwardRef } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { Document, Page, pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = `/static/pdf.worker.min.js`

import Loading from '../Loading/Loading'
import Pager from '../Pager/Pager'
import TableDownloader from '../TableDownloader/TableDownloader'

import cs from 'classnames'
import css from './DocumentViewer.module.scss'

DocumentViewer.propTypes = {
  className: PropTypes.string,
  document: PropTypes.object,
  marks: PropTypes.array,
  pageCount: PropTypes.number,
}

DocumentViewer.defaultProps = {}

export default function DocumentViewer({
  className,
  document,
  marks,
  redactions,
  tables,
  pageCount,
  highlightedMark,
  ...rest
}) {
  const { documentName, searchablePdfURL, documentURL } = document
  const isPDF = true // /.pdf$/.test(documentName)
  const viewerClassNames = classNames(css.viewer, className, isPDF && css.pdfViewer)
  const { containerRef, documentWidth, handleResize } = useDocumentResizer(isPDF, [marks, tables])
  const onLoadSuccess = useCallback(handleResize, [])

  const pager = (
    <Pager className={css.pager} pageTotal={pageCount}>
      {currentPageNumber =>
        isPDF ? (
          <DocumentMarks
            marks={marks}
            highlightedMark={highlightedMark}
            tables={tables}
            redactions={redactions}
            ref={containerRef}
          >
            <Page
              className={css.page}
              loading={<Loading />}
              pageNumber={currentPageNumber}
              width={documentWidth}
              renderAnnotationLayer={false}
            />
          </DocumentMarks>
        ) : (
          <div className={css.imageWrapper}>
            <DocumentMarks
              marks={marks}
              highlightedMark={highlightedMark}
              tables={tables}
              redactions={redactions}
            >
              <img className={css.image} src={documentURL} />
            </DocumentMarks>
          </div>
        )
      }
    </Pager>
  )
  return (
    <div className={viewerClassNames} {...rest}>
      {documentURL && isPDF && (
        <Document
          className={css.document}
          file={searchablePdfURL}
          loading={<Loading />}
          onLoadSuccess={onLoadSuccess}
        >
          {pager}
        </Document>
      )}

      {documentURL && !isPDF && pager}

      {!documentURL && <Loading />}
    </div>
  )
}

// Resize PDF on window resize
function useDocumentResizer(isPDF, resizeDeps) {
  const containerRef = useRef(null)
  const [documentWidth, setDocumentWidth] = useState(0)

  const handleResize = useCallback(() => {
    const sz = containerRef && containerRef.current && containerRef.current.offsetWidth
    if (sz !== documentWidth) setDocumentWidth(sz)
  }, [documentWidth])

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (isPDF) {
      window.addEventListener('resize', handleResize, { passive: true })
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [handleResize, isPDF])

  useEffect(() => {
    handleResize()
    setTimeout(() => {
      handleResize()
    }, 500)
  }, resizeDeps) // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, documentWidth, handleResize }
}

const DocumentMarks = forwardRef(function DocumentMarks(
  { children, marks , tables, redactions, highlightedMark },
  ref
) {

  return (
    <div className={css.canvasWrapper}>
      <div className={css.canvas} ref={ref}>
        {children}
        {marks &&
          marks.map(({ Top, Left, Width, Height, type, id }, i) => (
            <mark
              key={`${id || ''}${type || ''}` || i}
              className={cs(css.highlight, type, id === highlightedMark && css.highlighted)}
              style={{
                top: `${Top * 100}%`,
                left: `${Left * 100}%`,
                width: `${Width * 100}%`,
                height: `${Height * 100}%`,
              }}
            />
          ))}
        {redactions &&
          Object.values(redactions).map(({ Top, Left, Width, Height }, i) => (
            <mark
              key={i}
              className={css.redact}
              style={{
                top: `${Top * 100}%`,
                left: `${Left * 100}%`,
                width: `${Width * 100}%`,
                height: `${Height * 100}%`,
              }}
            />
          ))}
        {tables &&
          tables.map(({ table, rows }, i) => <TableHighlight key={i} table={table} rows={rows} />)}
      </div>
    </div>
  )
})

DocumentMarks.displayName = 'DocumentMarks'

DocumentMarks.propTypes = {
  children: PropTypes.node,
  marks: PropTypes.array,
}

function TableHighlight({ table, rows }) {
  const { Top, Left, Width, Height } = table.Geometry.BoundingBox
  return (
    <>
      <mark
        className={css.highlight}
        style={{
          top: `${Top * 100}%`,
          left: `${Left * 100}%`,
          width: `${Width * 100}%`,
          height: `${Height * 100}%`,
        }}
      />
      <TableDownloader {...{ table, rows }} />
      {rows.map((r, i) => (
        <Fragment key={i}>
          {r.map((cell, i) => {
            const { Top, Left, Width, Height } = cell.Geometry.BoundingBox
            return (
              <mark
                className={css.cellHighlight}
                style={{
                  top: `${Top * 100}%`,
                  left: `${Left * 100}%`,
                  width: `${Width * 100}%`,
                  height: `${Height * 100}%`,
                }}
              />
            )
          })}
        </Fragment>
      ))}
    </>
  )
}
