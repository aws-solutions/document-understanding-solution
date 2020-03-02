import { handleActions } from 'redux-actions'

import initialState from './data'
import { SET_SELECTED_TRACK, SET_HEADER_PROPS } from '../../constants/action-types.js'

export function uiReducer(state, { payload }) {
  return {
    ...state,
    ...payload.ui,
  }
}

export default handleActions(
  {
    [SET_SELECTED_TRACK]: uiReducer,
    [SET_HEADER_PROPS]: uiReducer,
  },
  initialState
)
