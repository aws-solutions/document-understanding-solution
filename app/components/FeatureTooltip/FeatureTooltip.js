import React, { useState } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import css from './FeatureTooltip.scss'

FeatureTooltip.propTypes = {
  className: PropTypes.string,
  description: PropTypes.string,
  title: PropTypes.string,
}

FeatureTooltip.defaultProps = {}

export default function FeatureTooltip({ className, description, title }) {
  const [isVisible, setVisible] = useState(false)
  const tooltipClassNames = classNames(css.tooltip, className)

  return (
    <div className={tooltipClassNames}>
      <img
        src="/static/images/icon_feature.svg"
        onClick={() => setVisible(isVisible => !isVisible)}
      />

      {isVisible && (
        <aside className={css.overlay}>
          <header>
            <h4>{title}</h4>
            <svg
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => setVisible(false)}
            >
              <g
                fill="none"
                fillRule="evenodd"
                stroke="#f2f4f4"
                strokeLinecap="round"
                strokeWidth="2"
              >
                <path d="m6 6 12 12" />
                <path d="m6 6 12 12" transform="matrix(-1 0 0 1 24 0)" />
              </g>
            </svg>
          </header>
          <p>{description}</p>
        </aside>
      )}
    </div>
  )
}
