import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import FileUpload from '../components/FileUpload/FileUpload'
import Button from '../components/Button/Button'

import css from './select.scss'
import SampleCollections from '../components/SampleCollections/SampleCollections'

Select.propTypes = {
  dispatch: PropTypes.func,
}

function Select({ dispatch }) {
  return (
    <div className={css.select}>
      <p>
        <Button inverted link={{ href: '/documents' }}>
          View Existing Documents
        </Button>
      </p>

      <h2>Upload your own documents</h2>
      <FileUpload />
      <h2>Or add some example documents</h2>
      <SampleCollections />
    </div>
  )
}

Select.getInitialProps = function() {
  return {
    pageTitle: 'Upload documents',
  }
}

export default connect(function mapStateToProps(state) {
  return {}
})(Select)
