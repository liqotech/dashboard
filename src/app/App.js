import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import {
  Route,
  withRouter,
  Switch, Redirect
} from 'react-router-dom';
import CRDList from '../CRD/CRDList';
import AppHeader from '../common/AppHeader';
import SideBar from '../common/SideBar';
import AppFooter from '../common/AppFooter';
import { Layout, notification, message } from 'antd';
import Home from '../home/Home';
import CustomView from '../views/CustomView'
import CRD from '../CRD/CRD';
import Authenticator from '../services/api/Authenticator';
import ErrorRedirect from '../error-handles/ErrorRedirect';
import Login from '../login/Login';
import { APP_NAME } from '../constants';
import Cookies from 'js-cookie';
import ConfigView from '../views/ConfigView';
import LoadingIndicator from '../common/LoadingIndicator';
import ApiInterface from '../services/api/ApiInterface';

function CallBackHandler(props) {
  props.func();
  return <LoadingIndicator />
}

function App(props) {
  /** Set the URL to which we make the call to the proxy */
  window.APISERVER_URL = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/apiserver';

  const initialPath = useRef(window.location.pathname);
  const [api, setApi] = useState(ApiInterface({id_token: ''}, props));
  const authManager = useRef(Authenticator());

  useEffect(() => {
    /** set global configuration for notifications and messages*/
    setGlobalConfig();

    if(Cookies.get('token')){
      manageToken(Cookies.get('token'));
    } else if(window.OIDC_PROVIDER_URL) {
      /** all is needed to manage an OIDC session */
      manageOIDCSession();
    } else props.history.push('/login');
  }, [])

  useEffect(() => {
    if(api.user.current.id_token !== ''){
      let path = initialPath.current.split('/')[1]
      if(path === 'login' ||
        path === 'callback' ||
        path === 'error'
      )
        props.history.push('/');
      else props.history.push(initialPath.current);
    }
  }, [api])

  /** Remove everything and redirect to the login page */
  const tokenLogout = () => {
    Cookies.remove('token');
    if(!window.OIDC_PROVIDER_URL){
      window.api = ApiInterface({id_token: ''}, props);
      api.setUser({id_token: ''})
      setApi({...api});
      props.history.push('/login');
    } else
      return authManager.current.logout();
  }

  const setGlobalConfig = () => {
    /** global notification config */
    notification.config({
      placement: 'bottomLeft',
      bottom: 30,
      duration: 3,
    });

    /** global message config */
    message.config({
      top: 0,
      duration: 2,
      maxCount: 1
    });
  }

  const manageToken = (token) => {
    if(api.user.current.id_token !== '') return;
    let user = { id_token: token };
    let _api = ApiInterface(user, props);
    /** Get the CRDs at the start of the app */
    _api.getCRDs().
    then(() => {
      _api.loadCustomViewsCRs();
      window.api = _api;
      setApi(_api);
      message.success('Successfully logged in');
      Cookies.set('token', token, {secure: true, sameSite: 'strict' })
    }).catch((error) => {console.log(error)});
  }

  const manageOIDCSession = () => {
    authManager.current.manager.events.addUserLoaded(user => {
      manageToken(user.id_token);
    });

    /** Refresh token (or logout is silent sign in is not enabled) */
    authManager.current.manager.events.addAccessTokenExpiring(() => {
      authManager.current.manager.signinSilent().then(user => {
        Cookies.remove('token');
        window.api = ApiInterface(user, props);
        Cookies.set('token', user.id_token, {secure: true, sameSite: 'strict' });
      }).catch(() => tokenLogout());
    });
  }

  /** Always present routes */
  let routes = [
    <Route key={'login'}
           exact path="/login"
           render={(props) => {
             return (window.OIDC_PROVIDER_URL ?
             <CallBackHandler func={authManager.current.login} /> :
             <Login {...props} func={manageToken} />)}
           }
    />,
    <Route key={'callback'}
           path="/callback"
           render={() => {
            return (window.OIDC_PROVIDER_URL ?
              <CallBackHandler func={authManager.current.completeLogin} /> :
              <Redirect to="/" />)}
           }
    />,
    <Route key={'logout'}
           exact path="/logout">
      <Redirect to="/login" />
    </Route>,
    <Route key={'error'}
           exact path="/error/:statusCode"
           component={(props) => <ErrorRedirect {...props} tokenLogout={tokenLogout} />}
    />
  ]

  /** Routes present only if logged in and apiManager created */
  if(api.user.current.id_token !== ''){
    routes.push(
      <Route key={'home'}
             exact path="/"
             render={(props) =>
               <Home {...props} />
             }/>,
      <Route key={'customresources'}
             exact path="/customresources"
             render={(props) =>
               <CRDList {...props} />
             }/>,
      <Route key={'crd'}
             exact path="/customresources/:crdName"
             render={(props) =>
               <CRD {...props} />
             }/>,
      <Route key={'customview'}
             exact path="/customview/:viewName/"
             render={(props) =>
               <CustomView {...props} />
             }/>,
      <Route key={'settings'}
             exact path="/settings"
             render={(props) =>
               <ConfigView {...props} />
             }/>,
    <Route key={'other'}
           component={() =>
             <ErrorRedirect match={{params: {statusCode: '404'}}} tokenLogout={tokenLogout} />
           }/>
    )
  } else {
    routes.push(
      <Route key={'other'}
             render={() => window.OIDC_PROVIDER_URL ?
               <Redirect to={'/login'} /> :
               <LoadingIndicator />}
      />
    )
  }

  return (
    <Layout>
      {api.user.current.id_token !== '' ? (
        <SideBar api={api}/>
      ) : null}
      <Layout>
        {api.user.current.id_token !== '' ? (
          <AppHeader
            tokenLogout={tokenLogout}
            logged={api.user.current.id_token !== ''}
          />) : null}
        <Layout.Content className="app-content">
          <Switch>
            {routes}
          </Switch>
        </Layout.Content>
        <AppFooter />
      </Layout>
    </Layout>
  );
}

export default withRouter(App);
