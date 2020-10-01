import { UserManager } from 'oidc-client';
import React from 'react';

/**
 * Api class to manage authN
 */

export default function Authenticator() {

  let manager = null;

  if (window.OIDC_CLIENT_ID === 'undefined') {
    window.OIDC_CLIENT_ID = OIDC_CLIENT_ID;
  }

  if (window.OIDC_PROVIDER_URL === 'undefined') {
    window.OIDC_PROVIDER_URL = OIDC_PROVIDER_URL;
  }

  if (window.OIDC_CLIENT_SECRET === 'undefined') {
    window.OIDC_CLIENT_SECRET = OIDC_CLIENT_SECRET;
  }

  if (window.OIDC_REDIRECT_URI === 'undefined') {
    window.OIDC_REDIRECT_URI = OIDC_REDIRECT_URI;
  }

  if(window.OIDC_PROVIDER_URL) {
    manager = new UserManager({
      automaticSilentRenew: true,
      response_type: 'code',
      filterProtocolClaims: true,
      scope: 'openid ',
      loadUserInfo: true,
      client_secret: window.OIDC_CLIENT_SECRET,
      authority: window.OIDC_PROVIDER_URL,
      client_id: window.OIDC_CLIENT_ID,
      redirect_uri: `${window.OIDC_REDIRECT_URI}/callback`,
      post_logout_redirect_uri: `${window.OIDC_REDIRECT_URI}/logout`
    });
  }

  /**
   * Function to perform the login.
   * It will automatically redirect you
   * @return {Promise<void>}
   */
  const login = () => {
    if(manager)
      return manager.signinRedirect();
  }

  /**
   * Function to process response from the authN endpoint
   * @return {Promise<User>}
   */
  const completeLogin = () => {
    if(manager)
      return manager.signinRedirectCallback().catch(error => console.log(error));
  }

  /**
   * Function to logout
   * @return {Promise<void>}
   */
  const logout = () => {
    if(manager)
      return manager.signoutRedirect().catch(error => console.log(error));
  }

  return{
    manager,
    login,
    completeLogin,
    logout
  }
}
