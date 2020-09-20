import React, { useEffect, useState } from 'react';
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
import ApiManager from '../services/ApiManager';
import CRD from '../CRD/CRD';
import Authenticator from '../services/Authenticator';
import ErrorRedirect from '../error-handles/ErrorRedirect';
import Login from '../login/Login';
import { APP_NAME } from '../constants';
import Cookies from 'js-cookie';
import ConfigView from '../views/ConfigView';
import LoadingIndicator from '../common/LoadingIndicator';

function CallBackHandler(props) {
  props.func();
  return <LoadingIndicator />
}

function App(props) {
  /** Set the URL to which we make the call to the proxy */
  window.APISERVER_URL = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/apiserver';

  const [api, setApi] = useState(new ApiManager({id_token: ''}));
  const authManager = new Authenticator();

  /** Remove everything and redirect to the login page */
  const tokenLogout = () => {
    window.api = new ApiManager({id_token: ''});
    setApi(new ApiManager({id_token: ''}));
    Cookies.remove('token');
    props.history.push('/login');
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
      top: 10
    });
  }

  const manageToken = token => {
    if(api.user.id_token !== '') return;
    let user = {
      id_token: token
    };
    let _api = new ApiManager(user);
    /** Get the CRDs at the start of the app */
    _api.getCRDs().
    then(() => {
      _api.loadCustomViewsCRs();
      window.api = _api;
      setApi(_api);
      notification.success({
        message: APP_NAME,
        description: 'Successfully logged in'
      });
      Cookies.set('token', token)
      props.history.push('/');
    })
  }

  const manageOIDCSession = () => {
    /** Check if previously logged */
    if(Cookies.get('token')){
      manageToken(Cookies.get('token'));
    } else {
      authManager.manager.events.addUserLoaded(user => {
        manageToken(user.id_token);
      });
    }

    /** Refresh token (or logout is silent sign in is not enabled) */
    authManager.manager.events.addAccessTokenExpiring(() => {
      authManager.manager.signinSilent().then(user => {
        api.refreshConfig(user);
        Cookies.set('token', user.id_token);
      }).catch((error) => {
        console.log(error);
        tokenLogout();
      });
    });
  }

  /** set global configuration for notifications and alert*/
  setGlobalConfig();

  if(authManager.OIDC) {
    /** all is needed to manage an OIDC session */
    manageOIDCSession();
  }

  /** Always present routes */
  let routes = [
    <Route key={'login'}
           exact path="/login"
           render={() => authManager.OIDC ? (
             <CallBackHandler func={authManager.login} />
           ) : <Login func={manageToken} logged={api.user.id_token !== ''} />}
    />,
    <Route key={'callback'}
           path="/callback"
           render={() => api.user.id_token !== '' ? (
             <Redirect to="/" />
           ) : ( <CallBackHandler func={authManager.completeLogin} />)}
    />,
    <Route key={'logout'}
           path="/logout">
      <Redirect to="/login" />
    </Route>,
    <Route key={'error'}
           path="/error/:statusCode"
           component={(props) => <ErrorRedirect {...props} authManager={authManager} tokenLogout={tokenLogout} />}
    />
  ]

  /** Routes present only if logged in and apiManager created */
  if(api.user.id_token !== ''){
    routes.push(
      <Route key={'/'}
             exact path="/"
             render={(props) =>
               <Home {...props} />
             }/>,
      <Route key={'customresources'}
             exact path="/customresources"
             component={(props) =>
               <CRDList {...props} />
             }/>,
      <Route key={'crd'}
             exact path="/customresources/:crdName"
             component={(props) =>
               <CRD {...props} />
             }/>,
      <Route key={'customview'}
             exact path="/customview/:viewName/"
             component={(props) =>
               <CustomView {...props} />
             }/>,
      <Route key={'settings'}
             exact path="/settings"
             component={(props) =>
               <ConfigView {...props} />
             }/>
    )
  } else {
    routes.push(
      <Route key={'*'}
             path="*">
        <Redirect to={'/login'} />
      </Route>)
  }

  return (
    <Layout>
      {api.user.id_token !== '' ? (
        <SideBar api={api}/>
      ) : null}
      <Layout>
        {api.user.id_token !== '' ? (
          <AppHeader
            tokenLogout={tokenLogout}
            authManager={authManager}
            logged={api.user.id_token !== ''}
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
