import React, { useCallback, useState } from 'react'
import { connect } from 'react-redux'
import cs from 'classnames';

import { getSearchQuery, getSearchStatus, getSearchPersona } from '../../store/entities/meta/selectors'
import { setSearchStatus, setSearchPersona } from '../../store/entities/meta/actions'
import { clearSearchResults, search } from '../../store/entities/searchResults/actions'

const PERSONAS = {
  scientist: 'Scientist',
  healthcareprovider: 'Healthcare Provider',
  generalpublic: 'General Public'
}

import css from './PersonaSelector.scss';
import PersonaInfoModal from '../PersonaInfoModal/PersonaInfoModal';

function PersonaSelector({
  dispatch,
  searchQuery,
  searchPersona
}) {
  const [ selectedPersona, setSelectedPersona ] = useState(searchPersona);

  const personaChange = useCallback(persona => {
    dispatch(setSearchStatus('pending'));
    dispatch(clearSearchResults())
    dispatch(setSearchPersona(persona))
    dispatch(search({
      k: searchQuery,
      persona
    })).then(() => {
      dispatch(setSearchStatus('success'))
    }).catch(err => {
      console.error(err);
      dispatch(setSearchStatus('error'))
    })
  }, [ dispatch, searchQuery ])

  const [ popoverVisible, setPopoverVisible ] = useState(false);

  const showPopover = useCallback(() => setPopoverVisible(true), [])

  const submit = useCallback(() => {
    personaChange(selectedPersona);
    setPopoverVisible(false)
  }, [ personaChange, selectedPersona ])

  const [ showingInfoModal, setShowingInfoModal ] = useState(false)

  const showInfoModal = useCallback(() => {
    setShowingInfoModal(true);
  }, [ ]);

  const hideInfoModal = useCallback(() => {
    setShowingInfoModal(false);
  }, []);

  const onModalSubmit = useCallback(persona => {
    personaChange(persona);
    setShowingInfoModal(false);
  }, [ personaChange ]);

  return (
    <div className={css.container}>
      <div className={css.filterButton} onClick={showPopover}>
        Filter
      </div>
      <div className={css.moreInfoContainer}>
        <a onClick={showInfoModal}>
          More info
        </a>
      </div>
      <div className={cs(css.popover, popoverVisible && css.visible)}>
        <p>
          <strong>Amazon Kendra</strong> can refine your results based on who you are. Select one of the users below, and see the different results each user gets.
        </p>
        <div className={css.personas}>
          <label>
            <img src="/static/images/healthcare-provider.png" />
            <input name="persona" type="radio" value="healthcareprovider" onChange={() => setSelectedPersona("healthcareprovider")} />
            <p>Healthcare provider</p>
          </label>
          <label>
            <img src="/static/images/scientist.png" />
            <input name="persona" type="radio" value="scientist" onChange={() => setSelectedPersona("scientist")} />
            <p>Scientist</p>
          </label>
          <label>
            <img src="/static/images/general-public.png" />
            <input name="persona" type="radio" value="generalpublic" onChange={() => setSelectedPersona("generalpublic")} />
            <p>General public</p>
          </label>
          <label>
            <img src="/static/images/user1.png" />
            <input name="persona" type="radio" value="" onChange={() => setSelectedPersona(undefined)} />
            <p>Don't filter search results</p>
          </label>
        </div>
        <footer>
          <button onClick={submit}>Select</button>
        </footer>
      </div>

      {showingInfoModal ?
        <PersonaInfoModal
          onClose={hideInfoModal}
          onSubmit={onModalSubmit}
        />
      : null}
    </div>
  )
}

export default connect(function mapStateToProps(state) {
  return {
    searchQuery: getSearchQuery(state),
    searchStatus: getSearchStatus(state),
    searchPersona: getSearchPersona(state)
  }
})(PersonaSelector)
