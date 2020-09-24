import React from 'react';

/**
 * Api class to manage authN
 */

function addUserLoaded(func){
  func({user: {
      id_token: 'password'
    }});
}

function signinSilent(){
  return Promise.resolve({
    user: {
      id_token: 'password'
    }
  })
}

function addAccessTokenExpiring(func){
  func();
}

function getManager(){
  return {
    events: {
      addUserLoaded: addUserLoaded,
      addAccessTokenExpiring: addAccessTokenExpiring
    },
    signinSilent: signinSilent
  };
}

export default function Authenticator(){
  let manager = getManager();

  const login = () => {
    window.history.pushState({}, '', '/callback?state=12345679')
    return true;
  }

  const completeLogin = () => {
    return true;
  }

  const logout = () => {
    return true;
  }

  return{
    manager,
    login,
    completeLogin,
    logout
  }
}
