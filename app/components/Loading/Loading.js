import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import css from './Loading.scss'

Loading.propTypes = {
  className: PropTypes.string,
  overlay: PropTypes.bool,
  size: PropTypes.number,
}

Loading.defaultProps = {
  overlay: true,
  size: 96,
  color: '#aab7b8',
  thickness: 2,
}

export default function Loading({ className, overlay, color, size, thickness, ...rest }) {
  const loadingClassNames = classNames(css.loading, className, { [css.overlay]: overlay })
  return (
    <div className={loadingClassNames} {...rest}>
      <svg
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
      >
        <circle
          cx="50"
          cy="50"
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          r="48"
          strokeDasharray="226.1946710584651 77.39822368615503"
          transform="rotate(239.89 50 50)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            calcMode="linear"
            values="0 50 50;360 50 50"
            keyTimes="0;1"
            dur="0.8s"
            begin="0s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  )
}
