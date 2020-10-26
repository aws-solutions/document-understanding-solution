
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
import { MIN_SEARCH_QUERY_LENGTH, ENABLE_KENDRA } from '../../../constants/configs'

// Track Schemas
export const trackSchema = new schema.Entity('tracks')
export const tracksSchema = new schema.Array(trackSchema)

// Track Lenses
export const lensTracks = lensPath(['entities', 'tracks'])
export const lensTrack = id => lensPath(['entities', 'tracks', id])
const kendraModeDescription = `
In this track, you can search through multiple documents and find information faster
and more efficiently, using  traditional search based technologies such as Amazon 
Elasticsearch Service (Amazon ES) as well using state-of-the-art machine learning and natural language enterprise search
with Amazon Kendra.

Once you select a document, you'll be able to interact with Amazon Textract,
Amazon Comprehend, and Amazon Comprehend Medical to experience the power
of document digitization and extraction of sensitive information.

For demo purposes, we've loaded data related to certain medical conditions. Ask a question related
to this topic and see the power of natural language search.
`
const classicModeDescription = `In this track, you can search through multiple documents and find information faster
and more efficiently, using Amazon Elasticsearch.

Once you select a document, you'll be able to interact with Amazon Textract,
Amazon Comprehend, and Amazon Comprehend Medical to experience the power
of document digitization and extraction of sensitive information.`
const discoveryTrackDescription = ENABLE_KENDRA? kendraModeDescription:classicModeDescription;
;
// Initial Data
export default {
  search: {
    id: 'search',
    title: 'Discovery',
    subtitle: 'Search across many documents, or within a single document',
    longDescription: discoveryTrackDescription,
    icon: '/static/images/icon_cloud-search.svg',
    palette: 'blue',
  },
  redaction: {
    id: 'redaction',
    title: 'Compliance',
    subtitle: 'Redact information from a document',
    longDescription: `
      In the compliance track, you can redact information from documents. You have the
      capability to redact specific key-value pairs detected by Amazon Textract, entities
      detected by Amazon Comprehend and medical entities detected by Comprehend
      Medical. You also have the flexibility to redact specific word matches under the
      Preview Tab.

      These controls help you redact Protected Health Information (PHI) and other
      sensitive information that may be critical to your use case. You also have the option
      to download the redacted document before you would want to share it.
    `,
    icon: '/static/images/icon_redact.svg',
    palette: 'teal',
  },
  workflow: {
    id: 'workflow',
    title: 'Workflow automation',
    subtitle: 'Edit and transfer data to other tools',
    longDescription: `
      This track focusses on how data from different AWS services in DUS can be
      consumed. The data extracted from DUS is available in the backend storage
      (Amazon S3) and then it can be consumed by your downstream dependencies.
    `,
    icon: '/static/images/icon_workflow.svg',
    palette: 'purple',
  },
}
