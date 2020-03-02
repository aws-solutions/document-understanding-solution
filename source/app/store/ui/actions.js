import { createAction } from 'redux-actions'
import { set } from 'ramda'

import { SET_SELECTED_TRACK, SET_HEADER_PROPS } from '../../constants/action-types.js'
import { lensSelectedTrack, lensHeaderProps } from './data'

export const setSelectedTrack = createAction(SET_SELECTED_TRACK, selectedTrack => {
  localStorage.setItem('track', selectedTrack)
  return set(lensSelectedTrack, selectedTrack, {})
})

export const setHeaderProps = createAction(SET_HEADER_PROPS, props =>
  set(lensHeaderProps, props, {})
)
