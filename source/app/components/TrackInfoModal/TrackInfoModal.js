import React from 'react';
import { connect } from 'react-redux'
import { getTracks } from '../../store/entities/tracks/selectors'

import Modal from '../Modal/Modal';
import Button from '../Button/Button'
import css from './TrackInfoModal.scss';

function TrackInfoModal({
  trackName,
  onNavigateToTrack,
  onClose,
  track
}) {
  const descriptionParagraphs = (track.longDescription || '').trim().split(/(?:\n\s*){2,}/);


  return (
    <Modal
      title={`${track.title} Track`}
      onRequestClose={onClose}
    >
      {descriptionParagraphs.map(text => <p>{text}</p>)}

      <div className={css.actions}>
        <Button onClick={onNavigateToTrack}>Okay</Button>
      </div>
    </Modal>
  )

}

export default connect(function mapStateToProps(state, { trackName }) {
  return {
    track: getTracks(state).find(x => x.id === trackName),
  }
})(TrackInfoModal)
