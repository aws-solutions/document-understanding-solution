
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

import React, { Fragment, useEffect, useState, useCallback } from "react";
import App, { Container } from "next/app";
import getConfig from "next/config";
import Head from "next/head";
import Router from "next/router";
import Amplify, { Auth } from "aws-amplify";
import { times } from "ramda";
import { Provider } from "react-redux";
import withRedux from "next-redux-wrapper";

import initStore from "../store/store";
import Header from "../components/Header/Header";

import { setSelectedTrack } from "../store/ui/actions";

import "../styles/global.scss";
import css from "./app.scss";

const {
  publicRuntimeConfig: {
    APIGateway,
    bucket,
    identityPoolId,
    region,
    userPoolWebClientId,
    userPoolId
  }
} = getConfig();

Amplify.configure({
  Auth: {
    identityPoolId,
    region,
    userPoolId,
    userPoolWebClientId
  },
  Storage: {
    AWSS3: {
      bucket,
      level: "public",
      region
    }
  },
  API: {
    endpoints: [
      {
        name: "TextractDemoTextractAPI",
        endpoint: `https://${APIGateway}.execute-api.${region}.amazonaws.com/prod/`
      }
    ]
  }
});

// This is a bit of a hack to ensure styles reload on client side route changes.
// See: https://github.com/zeit/next-plugins/issues/282#issuecomment-480740246
if (process.env.NODE_ENV !== "production") {
  Router.events.on("routeChangeComplete", () => {
    const path = "/_next/static/css/styles.chunk.css";
    const chunksSelector = `link[href*="${path}"]`;
    const chunksNodes = document.querySelectorAll(chunksSelector);
    const timestamp = new Date().valueOf();
    chunksNodes[0].href = `${path}?${timestamp}`;
  });
}

class AppLayout extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};
    const { pathname } = ctx;

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    return { pageProps, pathname };
  }

  componentDidMount() {
    // Set selected track from localStorage
    // This allows you to hard refresh a page and maintain some state
    if (localStorage) {
      const { store } = this.props;
      const cachedTrack = localStorage.getItem("track");
      if (cachedTrack) store.dispatch(setSelectedTrack(cachedTrack));
    }
  }

  render() {
    const { Component, pageProps, pathname, store } = this.props;
    const { pageTitle } = pageProps;

    // Don't render the app unless the user is logged in or this is a public route.
    return (
      <Provider store={store}>
        <Head>
          <title>{pageTitle ? `${pageTitle} | DUS ` : `DUS`}</title>
          <link
            rel="icon"
            type="image/ico"
            href="/static/images/favicon.ico"
          />
          <link
            rel="shortcut icon"
            type="image/ico"
            href="/static/images/favicon.ico"
          />
          <link
            rel="apple-touch-icon"
            sizes="57x57"
            href="/static/images/touch-icon-iphone-114-smile.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="72x72"
            href="/static/images/touch-icon-ipad-144-smile.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="114x114"
            href="/static/images/touch-icon-iphone-114-smile.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="144x144"
            href="/static/images/touch-icon-ipad-144-smile.png"
          />
        </Head>
        <Page pathname={pathname} pageProps={pageProps}>
          <Component {...pageProps} />
        </Page>
      </Provider>
    );
  }
}

function Page({ children, pageProps, pathname }) {
  const { backHref, backTitle, pageTitle: heading } = pageProps;
  const showGrid = useGridOverlay();

  // All routes are protected by default. We whitelist public routes.
  // Authorization does not occur on public routes.
  const isPublicRoute = ["/styleguide"].indexOf(pathname) >= 0;

  // The Login page is technically a public route, but we handle it separately because
  // we do an auth check on it in order to redirect if the user is already logged in.
  const isLoginRoute = pathname === "/";
  const [isLoggedIn, setLoggedIn] = useState("pending");

  // Don't render the app unless the user is logged in, or this is a public route,
  // or this is the login route and the user is not logged in.
  const shouldRenderApp =
    isLoggedIn === true || isPublicRoute || (isLoginRoute && !isLoggedIn);

  // Authorize user
  // NOTE: This method of authorization is not sufficient to protect static content.
  // The authorization happens on the client side only, which means all static
  // content still gets delivered to the browser in the initial page response
  // (even though we may not render it with React). However, all protected content
  // in this app is delivered by API calls that have their own authorization checks.
  useEffect(() => {
    // If this is a public route, we don't need to authorize.
    if (isPublicRoute) return;

    // Try to get the user's session info
    Auth.currentSession()
      .then(async () => {
        // User has a session
        isLoginRoute && (await Router.push("/home"));
        setLoggedIn(true);
      })
      .catch(() => {
        // No user session, redirect to login if not already there
        setLoggedIn(false);
        !isLoginRoute && Router.push("/");
      });
  }, [isLoginRoute, isPublicRoute]);

  return (
    shouldRenderApp && (
      <div className={css.container}>
        <Header {...{ heading, backHref, backTitle }} />

        <main>{children}</main>

        {showGrid && (
          <div className={css.gridContainer}>
            {times(
              i => (
                <div key={i} className={css.gridCol} />
              ),
              12
            )}
          </div>
        )}
      </div>
    )
  );
}

/**
 * This is a helper utility that will overlay a grid on top of the app.
 * This allows us to ensure elements fall on the grid while developing.
 * (Press control + L to toggle the grid)
 */
function useGridOverlay() {
  const [showGrid, setShowGrid] = useState(false);

  // Toggle grid handler
  const handleKeyUp = useCallback(e => {
    const L = 76;
    const { ctrlKey, keyCode } = e;

    if (ctrlKey && keyCode === L) {
      e.preventDefault();
      setShowGrid(showGrid => !showGrid);
    }
  }, []);

  // Add/remove event listener
  useEffect(() => {
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyUp]);

  return showGrid;
}

export default withRedux(initStore)(AppLayout);
