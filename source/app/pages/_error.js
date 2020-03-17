import React from 'react'
import PropTypes from 'prop-types'
import { reject, isNil } from 'ramda'

import Button from '../components/Button/Button'

import css from './error.scss'

Error.propTypes = {
  statusCode: PropTypes.number,
}

Error.getInitialProps = function({ res, err }) {
  const statusCode = res ? res.statusCode : err ? err.statusCode : null
  return reject(isNil, {
    pageTitle: 'Error',
    statusCode,
  })
}

export default function Error({ statusCode }) {
  return (
    <div className={css.error}>
      {statusCode ? (
        <p className={css.message}>
          A {statusCode} error occurred on server. Please refresh the page and try again.
        </p>
      ) : (
        <p className={css.message}>Something went wrong. Please refresh the page and try again.</p>
      )}

      <p>
        <Button link={{ href: '/home' }}>Go Home</Button>
      </p>
    </div>
  )
}
