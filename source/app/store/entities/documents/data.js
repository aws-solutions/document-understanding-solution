
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

import { schema } from 'normalizr'
import { lensPath } from 'ramda'

// Document Schemas
export const documentSchema = new schema.Entity(
  'documents',
  {},
  {
    idAttribute: 'documentId',
  }
)
export const documentsSchema = new schema.Array(documentSchema)

// Document Lenses
export const lensDocuments = lensPath(['entities', 'documents'])
export const lensDocument = id => lensPath(['entities', 'documents', id])

// Initial Data
export default {}
