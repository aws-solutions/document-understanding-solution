
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

import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import Link from 'next/link'
import PropTypes from 'prop-types'
import Router from 'next/router'
import { Auth } from 'aws-amplify'

import Button from '../Button/Button'
import LinkWithClickHandler from '../LinkWithClickHandler/LinkWithClickHandler'

import { getHeaderProps } from '../../store/ui/selectors'

import css from './Header.scss'
import { clearSearchQuery, setSearchPersona } from '../../store/entities/meta/actions'

Header.propTypes = {
  showNavigation: PropTypes.bool,
  backButton: PropTypes.bool
}

function Header({ showNavigation, backButton, dispatch }) {

  const clearSearch = useCallback(() => {
    dispatch(clearSearchQuery());
    dispatch(setSearchPersona(undefined));
  }, [])

  return (
    <header className={css.header}>
      <div>
        <Link href="/home">
          <a className={css.logoLink}>
            <img className={css.logo} src="/static/images/DUS_DEMO_logo_WhiteBG.svg" alt="AWS" />
          </a>
        </Link>

        {showNavigation && (
          <>
            <LinkWithClickHandler href="/documents" onClick={clearSearch}>
              <a className={css.backButton}>
                Document list
              </a>
            </LinkWithClickHandler>
            {' | '}
            <Link href="/select">
              <a className={css.backButton}>
                Upload your own documents
              </a>
            </Link>
          </>
        )}

        {backButton && (
          <LinkWithClickHandler href="/documents" onClick={clearSearch}>
            <a className={css.backButton}>
              Start a new search
            </a>
          </LinkWithClickHandler>
        )}
      </div>

      <div className={css.logoutlink}>
        <Button className={css.borderlessButton} inverted onClick={handleLogoutClick}>Log Out</Button>
      </div>
    </header>
  )
}

export default connect(function mapStateToProps(state, { ...originalProps }) {
  return { ...getHeaderProps(state), ...originalProps }
})(Header)

async function handleLogoutClick(e) {
  e.preventDefault()
  await Auth.signOut({ global: true })
  Router.push('/')
}
