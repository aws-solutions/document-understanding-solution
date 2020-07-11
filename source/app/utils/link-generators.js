
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

import PropTypes from 'prop-types'

/**
 * Reusable shape to use for propType validation. Any component that uses the
 * <Link> component should accept a `link` prop that is an object of this shape.
 *
 * For example:
 * ```
 * import { linkShape } from '../../utils/link-generators.js'
 *
 * static propTypes = {
 *   link: PropTypes.shape(linkShape)
 * }
 * ```
 */
export const linkShape = {
  as: PropTypes.string,
  href: PropTypes.string.isRequired,
  target: PropTypes.oneOf(['_blank']),
}

/**
 * The following functions generate link objects for various entities. These
 * objects are meant to be passed to a Link component from next.js, i.e. these
 * link objects represent the props passed to the Link component.
 *
 * For example:
 * ```
 * import Link from 'next/link'
 * import { makeDocumentLink } from '../../utils/link-generators.js'
 *
 * ...
 *
 * <Link {...makeDocumentLink('some-document-id')}>
 * ```
 */

/**
 * Generate a document link.
 *
 * @param  {String} id  The id of the document
 * @return {Object}     An object with a shape of `linkShape`
 */
export function makeDocumentLink(id) {
  if (!id) {
    throw new Error(`You must pass an id argument to makeDocumentLink. Received ${id}`)
  }

  return {
    href: `/documents/view?id=${id}`,
  }
}
