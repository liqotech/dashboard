import React from 'react';

/**
 * Api class to manage authN
 */

function addUserLoaded(func){
  func({user: {
      profile: 'user'
    }});
}

function signinSilent(){
  return Promise.resolve({
    user: {
      profile: 'user'
    }
  })
}

function addAccessTokenExpiring(func){
  func();
}

function getManager(){
  let manager = {
    events: {
      addUserLoaded: addUserLoaded,
      addAccessTokenExpiring: addAccessTokenExpiring
    },
    signinSilent: signinSilent
  };
  return manager;
}

export default class Authenticator {

  constructor() {

    this.manager = {};
    this.OIDC = false;
    this.token = '';

    if (window.OIDC_PROVIDER_URL) {
      this.OIDC = true;
      this.manager = getManager();
    }
  }

  login() {
    return true;
  }

  completeLogin() {
    return true;
  }

  logout() {
    return true;
  }
}
