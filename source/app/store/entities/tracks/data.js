
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

// Track Schemas
export const trackSchema = new schema.Entity('tracks')
export const tracksSchema = new schema.Array(trackSchema)

// Track Lenses
export const lensTracks = lensPath(['entities', 'tracks'])
export const lensTrack = id => lensPath(['entities', 'tracks', id])

// Initial Data
export default {
  search: {
    id: 'search',
    title: 'Discovery',
    subtitle: 'Search across many documents, or within a single document',
    icon: '/static/images/icon_cloud-search.svg',
    palette: 'blue',
  },
  redaction: {
    id: 'redaction',
    title: 'Compliance',
    subtitle: 'Redact information from a document',
    icon: '/static/images/icon_redact.svg',
    palette: 'teal',
  },
  workflow: {
    id: 'workflow',
    title: 'Workflow automation',
    subtitle: 'Edit and transfer data to other tools',
    icon: '/static/images/icon_workflow.svg',
    palette: 'purple',
  },
}
