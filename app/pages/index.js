import React, { useState, useCallback } from "react";
import Router from "next/router";
import { Auth } from "aws-amplify";

import Button from "../components/Button/Button";
import FormInput from "../components/FormInput/FormInput";
import Loading from "../components/Loading/Loading";

import css from "./login.scss";

Login.getInitialProps = function() {
  return {
    pageTitle: "Document Understanding Solution"
  };
};

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    passwordChangeRequired: false,
    newPassword: "",
    userInit: undefined
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    username,
    password,
    passwordChangeRequired,
    newPassword,
    userInit
  } = credentials;

  let userInputForm;

  const handleLoginSubmit = useCallback(
    async e => {
      e.preventDefault();
      setIsLoading(true);
      try {
        console.log("Signing in");
        const userInit = await Auth.signIn(username, password);
        if (userInit && userInit.challengeName === "NEW_PASSWORD_REQUIRED") {
          console.log("New password is required");
          setCredentials({
            passwordChangeRequired: true,
            userInit: userInit
          });
          setIsLoading(false);
        } else {
          userInit.signInUserSession && Router.push("/home");
        }
      } catch ({ message }) {
        setError(message);
        setIsLoading(false);
      }
    },
    [username, password, passwordChangeRequired, userInit]
  );

  const handlePasswordResetSubmit = useCallback(
    async e => {
      e.preventDefault();
      setIsLoading(true);
      try {
        console.log("Signed in, submitting new password");
        const user = await Auth.completeNewPassword(userInit, newPassword);
        console.log("Password change complete");
        user.signInUserSession && Router.push("/home");
      } catch ({ message }) {
        setError(message);
        setIsLoading(false);
      }
    },
    [userInit, newPassword]
  );

  const handleFormChange = useCallback(e => {
    const { name, value } = e.target;
    setCredentials(credentials => ({ ...credentials, [name]: value }));
  }, []);

  const loginForm = () => {
    return (
      <form onSubmit={handleLoginSubmit}>
        <p>
          <FormInput
            autoComplete="username"
            type="text"
            name="username"
            label="Username"
            value={username}
            onChange={handleFormChange}
          />
        </p>
        <p>
          <FormInput
            autoComplete="current-password"
            type="password"
            name="password"
            label="Password"
            value={password}
            onChange={handleFormChange}
          />
        </p>
        <Button disabled={isLoading}>Login</Button>
        {error && <p className={css.error}>{error}</p>}
      </form>
    );
  };

  const passwordResetForm = () => {
    return (
      <form onSubmit={handlePasswordResetSubmit}>
        <p>
          <FormInput
            autoComplete=""
            type="password"
            name="newPassword"
            label="New Password"
            value={newPassword}
            onChange={handleFormChange}
          />
        </p>
        <Button disabled={isLoading}>Login</Button>
        {error && <p className={css.error}>{error}</p>}
      </form>
    );
  };

  userInputForm = passwordChangeRequired ? passwordResetForm() : loginForm();

  return (
    <article>
      <div className={css.form}>
        <h2>Login</h2>
        {userInputForm}
        {isLoading && <Loading />}
      </div>
    </article>
  );
}
