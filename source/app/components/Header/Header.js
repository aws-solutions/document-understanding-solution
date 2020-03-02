import React from 'react'
import { connect } from 'react-redux'
import Link from 'next/link'
import PropTypes from 'prop-types'
import Router from 'next/router'
import { Auth } from 'aws-amplify'

import Button from '../Button/Button'

import { getHeaderProps } from '../../store/ui/selectors'

import css from './Header.scss'

Header.propTypes = {
  backHref: PropTypes.string,
  heading: PropTypes.string,
}

function Header({ backHref, backTitle, heading }) {
  return (
    <header className={css.header}>
      <div>
        <Link href="/home">
          <a className={css.logoLink}>
            <img className={css.logo} src="/static/images/logo_aws.svg" alt="AWS" />
          </a>
        </Link>

        {backHref && (
          <Link href={backHref}>
            <a className={css.backButton}>
              {backTitle}
            </a>
          </Link>
        )}
      </div>

      <h1>{heading}</h1>
       
      

      <div className={css.logoutlink}>
        <Button className={css.borderlessButton} inverted onClick={handleLogoutClick}>Log Out</Button>
      </div>
    </header>
  )
}

export default connect(function mapStateToProps(state) {
  return { ...getHeaderProps(state) }
})(Header)

async function handleLogoutClick(e) {
  e.preventDefault()
  await Auth.signOut({ global: true })
  Router.push('/')
}
