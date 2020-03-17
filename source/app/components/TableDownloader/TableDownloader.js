import React, { useMemo, useEffect } from 'react'

import Button from '../Button/Button'

import css from './TableDownloader.scss'

export default function TableDownloader({ table, rows }) {
  const tableBlob = useMemo(() => {
    const csv = rows
      .map(row => {
        return row
          .map(cell => cell.content)
          .map(x => `"${x.replace(/"/g, '""')}"`)
          .join(',')
      })
      .join('\n')
    return new Blob(['\ufeff', csv], { type: 'text/csv' })
  }, [rows])

  const url = useMemo(() => URL.createObjectURL(tableBlob), [tableBlob])
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [url])

  const { Top, Left, Width, Height } = table.Geometry.BoundingBox

  return (
    <Button
      style={{
        top: `${(Top + Height) * 100}%`,
        left: `${Left * 100}%`,
      }}
      className={css.button}
      href={url}
      link={{ download: 'table.csv' }}
    >
      Download CSV
    </Button>
  )
}
