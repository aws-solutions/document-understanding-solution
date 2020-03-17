import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import Highlighter from 'react-highlighter'

import css from './Highlight.scss'

Highlight.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

Highlight.defaultProps = {}

export default function Highlight({ children, className, ...rest }) {
  const matchClassNames = classNames(css.match, className)

  return (
    <Highlighter matchClass={matchClassNames} {...rest}>
      {children}
    </Highlighter>
  )
}
