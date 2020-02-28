import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {  setSelectedTrack} from '../../store/ui/actions'

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

export default function Tabs({ children,track, selected, className, items, isTrackTab, onSelectTab, ...rest }) {
  let tabsClassNames = null
  const dispatch = useDispatch()

  isTrackTab?tabsClassNames = classNames(css.trackTabs, className):tabsClassNames=classNames(css.tabs,css.className)

  function handleTabClick(e) {
    e.preventDefault()
    const id = e.target.getAttribute('data-id')
    onSelectTab(id)
    if(id=='searchTrack'){dispatch(setSelectedTrack('search'));}
    if(id=='complianceTrack')dispatch(setSelectedTrack('redaction'))
    if(id=='workflowTrack')dispatch(setSelectedTrack('workflow'))
  }

  return (
    <div className={tabsClassNames} {...rest}>
      <nav>
        <ul>
          {items.map(({ id, title }, i) => {
            return (
              <li key={i} 
              className={selected === id ? css.active : 
                        id=='searchTrack' && track == 'search'? css.active:
                        id=='complianceTrack' && track == 'redaction'? css.active: 
                        id=='workflowTrack' && track == 'workflow'? css.active:
                        null}>
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
