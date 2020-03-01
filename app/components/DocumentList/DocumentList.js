import React from 'react'
import PropTypes from 'prop-types'
import Link from 'next/link'
import classNames from 'classnames'

import Loading from '../Loading/Loading'
import DocumentListItem from '../DocumentListItem/DocumentListItem'

import css from './DocumentList.scss'

DocumentList.propTypes = {
  className: PropTypes.string,
  items: PropTypes.array,
}

DocumentList.defaultProps = {
  items: [],
}

export default function DocumentList({ className, items }) {
  const listClassNames = classNames(css.list, className)

  return (
    !!items.length && (
      <nav className={listClassNames}>
        <header className={css.listHeader}>
          <span className={css.leftSpace} />
          <span className={css.nameHeader}>File Name</span>
          <span className={css.typeHeader}>Type</span>
          <span className={css.statusHeader}>Status</span>
          <span className={css.rightSpace} />
        </header>
        <ul>
          {items.map(({ id, title, link, documentStatus }, index) => {
            const { target, ...linkProps } = link || {}

            const filenameParts = title.split('.')
            const extension = filenameParts.pop().toUpperCase()
            const basename = filenameParts.join('.')

            return (
              <DocumentListItem
                key={id}
                {...{
                  id,
                  title,
                  basename,
                  extension,
                  
                  documentStatus,
                  link,
                }}
              />
            )
          })}
        </ul>
      </nav>
    )
  )
}
