import { combineReducers } from 'redux'
import entities from './entities/reducer.js'
import ui from './ui/reducer.js'

export default function makeRootReducer() {
  return combineReducers({
    entities,
    ui,
  })
}
