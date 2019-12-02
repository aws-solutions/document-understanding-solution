import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly'
import thunkMiddleware from 'redux-thunk'
import promiseMiddleware from 'redux-promise'

import makeRootReducer from './reducer.js'

const baseInitialState = {}

export default function initStore(initialState = baseInitialState) {
  // Middleware Configuration
  // ===========================================================================
  const middleware = [thunkMiddleware, promiseMiddleware]

  // Create Store
  // ===========================================================================
  const store = createStore(
    makeRootReducer(),
    initialState,
    composeWithDevTools(applyMiddleware(...middleware))
  )

  /* istanbul ignore next */
  if (module.hot) {
    module.hot.accept('./reducer', () => {
      const { default: reducer } = require('./reducer')
      store.replaceReducer(reducer())
    })
  }

  return store
}
