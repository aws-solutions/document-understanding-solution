import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import Highlight from '../Highlight/Highlight'

import css from './Table.scss'

Table.propTypes = {
  className: PropTypes.string,
  rows: PropTypes.array,
  searchQuery: PropTypes.string,
}

Table.defaultProps = {
  rows: [],
  searchQuery: '',
}

export default function Table({ className, rows, searchQuery, ...rest }) {
  const searchQueryRegex = RegExp(`${searchQuery}`, 'i')
  const tableContainerClassNames = classNames(css.tableContainer, className)

  if (!rows.length) return null

  return (
    <div className={tableContainerClassNames} {...rest}>
      <table>
        <tbody>
          {rows.map((cells, rowIndex) => {
            return (
              <tr key={rowIndex}>
                {cells.map(({ content, ColumnSpan, RowSpan }, cellIndex) => (
                  <td
                    key={cellIndex}
                    colSpan={ColumnSpan > 1 ? ColumnSpan : null}
                    rowSpan={RowSpan > 1 ? RowSpan : null}
                    className={!searchQueryRegex.test(content) ? css.muted : null}
                  >
                    <Highlight search={searchQuery}>{content}</Highlight>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
