import React, { Fragment } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import css from './Card.scss'

export const CARD_PALETTES = ['blue', 'black', 'teal', 'purple']
export const CARD_VOLUMES = ['loud', 'conversational', 'quiet']

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  icon: PropTypes.node,
  palette: PropTypes.oneOf(CARD_PALETTES),
  subtitle: PropTypes.string,
  title: PropTypes.string,
  volume: PropTypes.oneOf(CARD_VOLUMES),
}

Card.defaultProps = {
  className: '',
  palette: 'black',
  volume: 'conversational',
}

export default function Card({
  children,
  className,
  icon,
  palette,
  title,
  subtitle,
  volume,
  ...rest
}) {
  const cardClassNames = classNames(css.card, css[palette], css[volume], className)

  function handleKeyPress() {
    if (!rest.onClick) return
    const code = event.keyCode || event.which
    if (code === 13) rest.onClick()
  }

  return (
    <div className={cardClassNames} onKeyPress={handleKeyPress} {...rest} tabIndex={0}>
      {children ? (
        children
      ) : (
        <Fragment>
          {icon && <div className={css.icon}>{icon}</div>}
          <div>
            {title && <h3 className={css.title}>{title}</h3>}
            {subtitle && <p className={css.subtitle}>{subtitle}</p>}
          </div>
        </Fragment>
      )}
    </div>
  )
}
