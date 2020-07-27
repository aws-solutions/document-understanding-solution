import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux'
import { getSearchPersona } from '../../store/entities/meta/selectors'

import Modal from '../Modal/Modal';
import Button from '../Button/Button'
import css from './PersonaInfoModal.scss';

const COVID_QUESTIONS = [
  'What are the testing guidelines for COVID-19?',
  'How to prevent transmission of COVID-19',
  'What is the recommended treatment for COVID-19?'
]

function PersonaInfoModal({
  onClose,
  onSubmit,
  searchPersona
}) {
  const [ selectedPersona, setSelectedPersona ] = useState(searchPersona)

  const submit = useCallback((query) => {
    onSubmit(selectedPersona, query);
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
            <img src="/static/images/healthcare-provider.png" />
            <input name="persona" type="radio" value="healthcareprovider" onChange={() => setSelectedPersona("healthcareprovider")} />
            <h4>Healthcare provider</h4>
            <p>Has access to information for Healthcare Professionals.</p>
          </label>
          <label>
            <img src="/static/images/scientist.png" />
            <input name="persona" type="radio" value="scientist" onChange={() => setSelectedPersona("scientist")} />
            <h4>Scientist</h4>
            <p>Has access to scientific papers and research documents.</p>
          </label>
          <label>
            <img src="/static/images/general-public.png" />
            <input name="persona" type="radio" value="generalpublic" onChange={() => setSelectedPersona("generalpublic")} />
            <h4>General public</h4>
            <p>Has access to official guidance to prevent and manage COVID-19.</p>
          </label>
          <label>
            <img src="/static/images/nofilter.svg" />
            <input name="persona" type="radio" value="" onChange={() => setSelectedPersona(undefined)} />
            <h4>No filter</h4>
            <p>Use this option for unfiltered search results.</p>
          </label>
        </div>
      </section>

      <section>
        <header>
          <div className={css.stepLabel}>
            Step 2
          </div>
          <p>Search for a COVID-19-related term to see the sample results</p>
        </header>

        <ul className={css.sampleQueries}>
          {COVID_QUESTIONS.map(q => (
            <li onClick={() => submit(q)}>{q}</li>
          ))}
        </ul>
      </section>

      <div className={css.actions}>
        <Button palette="black" onClick={onClose}>Cancel</Button>
        <Button onClick={() => submit()}>Filter Search Results</Button>
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
