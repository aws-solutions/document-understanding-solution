import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import css from './Tabs.scss'

Tabs.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  items: PropTypes.array,
  selected: PropTypes.string,
}

Tabs.defaultProps = {
  children: null,
  items: [],
}

export default function Tabs({ children, selected, className, items, onSelectTab, ...rest }) {
  const tabsClassNames = classNames(css.tabs, className)

  function handleTabClick(e) {
    e.preventDefault()
    const id = e.target.getAttribute('data-id')
    onSelectTab(id)
  }

  return (
    <div className={tabsClassNames} {...rest}>
      <nav>
        <ul>
          {items.map(({ id, title }, i) => {
            return (
              <li key={i} className={selected === id ? css.active : null}>
                <a href="#" data-id={id} onClick={handleTabClick}>
                  {title}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      {children}
    </div>
  )
}
