import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Router from 'next/router'

import Card from '../components/Card/Card'

import { setSelectedTrack } from '../store/ui/actions'
import { getTracks } from '../store/entities/tracks/selectors'

import css from './home.scss'

Home.propTypes = {
  dispatch: PropTypes.func,
  tracks: PropTypes.array,
}

function Home({ dispatch, tracks }) {
  const handleCardClick = useCallback(
    id => {
      dispatch(setSelectedTrack(id))
      Router.push('/documents')
    },
    [dispatch]
  )

  return (
    <div className={css.home}>
      <div className={css.tracks}>
        {tracks.map(({ id, icon, ...rest }) => (
          <Card {...rest} key={id} icon={<img src={icon} />} onClick={() => handleCardClick(id)} />
        ))}
      </div>

      {/* <p>
        <img src="/static/images/icon_feature.svg" /> If you see one of these along the way, click
        on it to learn more about Textract’s features.
      </p> */}
    </div>
  )
}

Home.getInitialProps = function() {
  return {
    pageTitle: 'Welcome',
  }
}

export default connect(function mapStateToProps(state) {
  return {
    tracks: getTracks(state),
  }
})(Home)
