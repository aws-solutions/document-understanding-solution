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

 function isSupportedExtension(extension){
  console.log(extension)
  if (['png', 'jpg', 'jpeg','pdf'].indexOf(extension.toLowerCase()) >= 0) {
    return true
  }
  return false
}

function returnFormattedExtension(extension){
  if (isSupportedExtension(extension)){
    return extension.toUpperCase();
  }
  else{
    return "NOT SUPPORTED";
  }
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
            const extension = returnFormattedExtension(filenameParts.pop())
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
