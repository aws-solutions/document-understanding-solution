
/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

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
