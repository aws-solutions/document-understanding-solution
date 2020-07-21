import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux'
import { getSearchPersona } from '../../store/entities/meta/selectors'

import Modal from '../Modal/Modal';
import Button from '../Button/Button'
import css from './PersonaInfoModal.scss';

function PersonaInfoModal({
  onClose,
  onSubmit,
  searchPersona
}) {
  const [ selectedPersona, setSelectedPersona ] = useState(searchPersona)

  const submit = useCallback(() => {
    onSubmit(selectedPersona);
  }, [ onSubmit, selectedPersona ])

  return (
    <Modal
      title="Filter query results on User Context"
      onRequestClose={onClose}
    >
      <p>Amazon Kendra can refine your results based on who you are. Follow these simple steps, and see howthis feature works.</p>

      <section>
        <header>
          <div className={css.stepLabel}>
            Step 1
          </div>
          <p>Select one of the fictitious users we've created to demoinstrate this feature. Each user has access to different resources.</p>
        </header>

        <div className={css.personas}>
          <label>
            <img src="/static/images/healthcare-provider.svg" />
            <input name="persona" type="radio" value="healthcareprovider" onChange={() => setSelectedPersona("healthcareprovider")} />
            <p>Healthcare provider</p>
            <p>Has access to information for Healthcare Professionals.</p>
          </label>
          <label>
            <img src="/static/images/scientist.svg" />
            <input name="persona" type="radio" value="scientist" onChange={() => setSelectedPersona("scientist")} />
            <p>Scientist</p>
            <p>Has access to scientific papers and research documents.</p>
          </label>
          <label>
            <img src="/static/images/general-public.svg" />
            <input name="persona" type="radio" value="generalpublic" onChange={() => setSelectedPersona("generalpublic")} />
            <p>General public</p>
            <p>Has access to official guidance to prevent and manage COVID-19.</p>
          </label>
          <label>
            <img src="/static/images/user1.svg" />
            <input name="persona" type="radio" value="" onChange={() => setSelectedPersona(undefined)} />
            <p>No filter</p>
            <p>Use this option for unfiltered search results.</p>
          </label>
        </div>
      </section>

      <section>
        <header>
          <div className={css.stepLabel}>
            Step 2
          </div>
          <p>Choose one of the COVID-19 queries autosuggested in the search bar</p>
        </header>

        <p>TODO add suggested searchs in here. [ NOTE: THIS FEELS A BIT UNNATURAL HERE? ]</p>
      </section>

      <div className={css.actions}>
        <Button onClick={submit}>Filter Search Results</Button>
      </div>

      <aside className={css.notes}>
        Please note, this demo allows you to upload your own documents. If you do so, Kendra will index your documents
        and you'll be able to search through them. Hoever, the filtering feature won't work. The three users and COVID-19
        datasets are used to demonstrate the <strong>Filter query results on User Context</strong> feature.
      </aside>
    </Modal>
  )

}

export default connect(function mapStateToProps(state, { trackName }) {
  return {
    searchPersona: getSearchPersona(state)
  }
})(PersonaInfoModal)
