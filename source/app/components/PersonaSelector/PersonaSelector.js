/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import cs from "classnames";

import {
  getSearchQuery,
  getSearchStatus,
  getSearchPersona,
} from "../../store/entities/meta/selectors";
import {
  setSearchStatus,
  setSearchQuery,
  setSearchPersona,
} from "../../store/entities/meta/actions";
import {
  clearSearchResults,
  search,
} from "../../store/entities/searchResults/actions";

const PERSONAS = {
  scientist: "Scientist",
  healthcareprovider: "Healthcare Provider",
  generalpublic: "General Public",
};

import css from "./PersonaSelector.scss";
import PersonaInfoModal from "../PersonaInfoModal/PersonaInfoModal";
import Button from "../Button/Button";

function PersonaSelector({ dispatch, searchQuery, searchPersona }) {
  const [selectedPersona, setSelectedPersona] = useState(searchPersona);

  const personaChange = useCallback(
    (persona) => {
      dispatch(setSearchPersona(persona));
    },
    [dispatch, searchQuery]
  );

  const [popoverVisible, setPopoverVisible] = useState(false);

  const showPopover = useCallback(() => setPopoverVisible(true), []);
  const hidePopover = useCallback(() => setPopoverVisible(false), []);

  const submit = useCallback(() => {
    personaChange(selectedPersona);
    setPopoverVisible(false);
  }, [personaChange, selectedPersona]);

  const [showingInfoModal, setShowingInfoModal] = useState(false);

  const showInfoModal = useCallback(() => {
    setShowingInfoModal(true);
  }, []);

  const hideInfoModal = useCallback(() => {
    setShowingInfoModal(false);
  }, []);

  const onModalSubmit = useCallback(
    (persona, query) => {
      personaChange(persona);
      if (query) {
        dispatch(setSearchQuery(query));
      }
      setShowingInfoModal(false);
    },
    [personaChange, dispatch]
  );

  return (
    <div className={css.container}>
      {popoverVisible
        ? ReactDOM.createPortal(
            <div className={css.overlay} onClick={hidePopover} />,
            document.body
          )
        : null}
      <div
        className={cs(css.filterButton, searchPersona && css.hasFilter)}
        onClick={showPopover}
      >
        Filter
      </div>
      <div className={css.moreInfoContainer}>
        <a onClick={showInfoModal}>More info</a>
      </div>
      <div className={cs(css.popover, popoverVisible && css.visible)}>
        <p>
          <strong>Amazon Kendra</strong> can deliver highly relevant query
          results based on user name or group membership. Select one of the
          users below, and see the different results each user gets.
        </p>
        <div className={css.personas}>
          <label>
            <img src="/static/images/healthcare-provider.png" />
            <input
              name="persona"
              type="radio"
              value="healthcareprovider"
              onChange={() => setSelectedPersona("healthcareprovider")}
            />
            <p>Healthcare provider</p>
          </label>
          <label>
            <img src="/static/images/scientist.png" />
            <input
              name="persona"
              type="radio"
              value="scientist"
              onChange={() => setSelectedPersona("scientist")}
            />
            <p>Scientist</p>
          </label>
          <label>
            <img src="/static/images/general-public.png" />
            <input
              name="persona"
              type="radio"
              value="generalpublic"
              onChange={() => setSelectedPersona("generalpublic")}
            />
            <p>General public</p>
          </label>
          <label>
            <img src="/static/images/nofilter.svg" />
            <input
              name="persona"
              type="radio"
              value=""
              onChange={() => setSelectedPersona(undefined)}
            />
            <p>Don't filter search results</p>
          </label>
        </div>
        <footer>
          <Button palette="black" onClick={hidePopover}>
            Cancel
          </Button>
          <Button onClick={submit}>Select</Button>
        </footer>
      </div>

      {showingInfoModal ? (
        <PersonaInfoModal onClose={hideInfoModal} onSubmit={onModalSubmit} />
      ) : null}
    </div>
  );
}

export default connect(function mapStateToProps(state) {
  return {
    searchQuery: getSearchQuery(state),
    searchStatus: getSearchStatus(state),
    searchPersona: getSearchPersona(state),
  };
})(PersonaSelector);
