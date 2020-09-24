import { UserManager } from 'oidc-client';
import React from 'react';

/**
 * Api class to manage authN
 */

export default function Authenticator() {
  let manager = new UserManager({
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

  /**
   * Function to perform the login.
   * It will automatically redirect you
   * @return {Promise<void>}
   */
  const login = () => {
    if(manager)
      return manager.signinRedirect().catch(error => {
        console.log('login', error);
        logout().catch(error => console.log(error));
      });
  }

  /**
   * Function to process response from the authN endpoint
   * @return {Promise<User>}
   */
  const completeLogin = () => {
    if(manager)
      return manager.signinRedirectCallback().catch(error => {
        console.log('completeLogin', error);
        logout().catch(error => console.log(error));
      });
  }

  /**
   * Function to logout
   * @return {Promise<void>}
   */
  const logout = () => {
    if(manager)
      return manager.signoutRedirect();
  }

  return{
    manager,
    login,
    completeLogin,
    logout
  }
}
