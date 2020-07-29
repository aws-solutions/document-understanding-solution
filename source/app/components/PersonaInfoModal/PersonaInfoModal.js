import React, { useState, useCallback, useRef } from 'react';
import { connect } from 'react-redux'
import { getSearchPersona } from '../../store/entities/meta/selectors'

import Modal from '../Modal/Modal';
import Button from '../Button/Button'
import css from './PersonaInfoModal.scss';
import cs from 'classnames';
import FormInput from '../FormInput/FormInput';

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

  const inputRef = useRef();

  const submit = useCallback((query) => {
    onSubmit(selectedPersona, query);
  }, [ onSubmit, selectedPersona ])

  const submitForm = useCallback((e) => {
    e.preventDefault();
    submit(inputRef.current.value);
  }, [ submit ]);

  const [ apiVisible, setApiVisible ] = useState(false);
  const toggleAPI = useCallback(() => setApiVisible(x => !x), [])

  return (
    <Modal
      title="Filter query results on User Context"
      onRequestClose={onClose}
    >
      <p>Amazon Kendra can deliver highly relevant query results based on user name or group membership. Follow these simple steps, and see how this feature works.</p>

      <section>
        <header>
          <div className={css.stepLabel}>
            Step 1
          </div>
          <p>For this demo, we created fictitious users and search queries to showcase how the filtering feature works. Select one of the fictitious users below.</p>
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
          <p>Choose one of the auto suggested queries we’ve created to demonstrate this feature.</p>
        </header>

        <ul className={css.sampleQueries}>
          {COVID_QUESTIONS.map(q => (
            <li onClick={() => submit(q)}>{q}</li>
          ))}
        </ul>
        <form className={css.searchForm} onSubmit={submitForm}>
          <FormInput type="search" white placeholder="Try one of these queries" ref={inputRef} />
        </form>
      </section>

      <div className={css.actions}>
        <Button palette="black" onClick={onClose}>Cancel</Button>
        <Button onClick={() => submit()}>Filter Search Results</Button>
      </div>

      <aside className={css.notes}>
        Please note, this demo allows you to upload your own documents. If you do so, Kendra will index your documents
        and you'll be able to search through them. However, the filtering feature won't work. The three users and COVID-19
        datasets are used to demonstrate the <strong>Filter query results on User Context</strong> feature.
      </aside>

      <div className={cs(css.toggleAPI, apiVisible && css.expanded)} onClick={toggleAPI}>
        Want to see the query filtering API? Check out the sample code
      </div>

      {apiVisible && <>
        <section>
          <p>Amazon Kendra can deliver highly relevant query results based on user name or group membership.  To enable this feature, documents must be indexed into Kendra along with their relevance to various users and groups.  Queries can then include this information to obtain filtered results sets that matter to specific users.   The code snippet below shows how this information is supplied. </p>
        </section>
        <section>
          <pre>{`
response = kendra.query(
  QueryText = query,
  IndexId = index,
  AttributeFilter = {
    "OrAllFilters": [
      {
        "EqualsTo": {
          "Key": "_user_id",
          "Value": {
            "StringValue": "user1"
          }
        }
      },
      {
        "EqualsTo": {
          "Key": "_group_ids",
          "Value": {
            "StringListValue": ["HR", "IT"]
          }
        }
      }
    ]
  }
)
`.trim()}
          </pre>
        </section>
        <p className={css.learnMore}>
          <a href="LINK TODO">Learn more about this feature in the Amazon Kendra Developers page</a>
        </p>
      </>}
    </Modal>
  )

}

export default connect(function mapStateToProps(state, { trackName }) {
  return {
    searchPersona: getSearchPersona(state)
  }
})(PersonaInfoModal)
