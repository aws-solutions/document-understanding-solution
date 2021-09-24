
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

import React,{useRef} from 'react'

import css from './BarcodeResults.module.scss'
import cs from "classnames";

export default function BarcodeResults({
  barcodes,
  visible,
  currentPageNumber,
  document
}) {

    if (!visible) return (<div></div>);

  if (!barcodes || !barcodes.BarcodesRaw || barcodes.length===0 ) {
    return <p className={cs(css.noKv)}>No Barcodes detected</p>
  }

  return (

    <div className={cs(css.kvList, visible && css.visible)}>

        <h4 className={css.tableContainer}>Barcodes Combined: {barcodes.BarcodesCombined.length}</h4>
<ul>
            {barcodes.BarcodesCombined.map((row, rowIndex) => {
                return (
                    <li key={rowIndex}>
                       Format: {row.format}, Combined from raw chunks: {row.sources.join(', ')}
                            <div className={css.cell}>
                                <pre>{row.content} </pre></div>

                    </li>
                )
            })}
</ul>
      <h4 className={css.tableContainer}>Barcodes Raw: {barcodes.BarcodesRaw.length}</h4>

        <ul>
        {barcodes.BarcodesRaw.map((row, rowIndex) => {
          return (
              <li key={rowIndex}
                  className={cs(
                      css.kv,
                      row.page+1 === currentPageNumber && css.onThisPage
                  )}
              >
                      Num: {rowIndex}, Page: {row.page+1}, Format: {row.format}
                      <div className={css.cell}><pre> {row.raw}</pre></div>

              </li>
          )
        })}

      </ul>

    </div>
  )

}


