import React, { useEffect, useRef, useState } from 'react';
import { Route, withRouter, Switch, Redirect } from 'react-router-dom';
import AppHeader from '../common/AppHeader';
import SideBar from '../common/SideBar';
import { Layout, notification, message } from 'antd';
import _ from 'lodash';
import Authenticator from '../services/api/Authenticator';
import ErrorRedirect from '../error-handles/ErrorRedirect';
import Login from '../login/Login';
import Cookies from 'js-cookie';
import LoadingIndicator from '../common/LoadingIndicator';
import ApiInterface from '../services/api/ApiInterface';
import AppFooter from '../common/AppFooter';
import Utils from '../services/Utils';
import PluginLoader from '../views/PluginLoader';
import DefaultRoutes from '../services/api/DefaultRoutes';
import './App.css';
import './CRD.css';
import './CRDList.css';
import './CR.css';

function CallBackHandler(props) {
  props.func();
  return <LoadingIndicator />;
}

function App(props) {
  /** Set the URL to which we make the call to the proxy */
  window.APISERVER_URL =
    window.location.protocol +
    '//' +
    window.location.hostname +
    ':' +
    window.location.port +
    '/apiserver';

  const initialPath = useRef(
    window.location.pathname.replace(process.env.PUBLIC_PATH, '')
  );
  const [api, setApi] = useState(ApiInterface({ id_token: '' }));
  const authManager = useRef(Authenticator());
  const [, setConfig] = useState(null);

  useEffect(() => {
    /** set global configuration for notifications and messages*/
    setGlobalConfig();

    if (Utils().getCookie()) {
      manageToken(Utils().getCookie());
    } else if (window.OIDC_PROVIDER_URL) {
      /** all is needed to manage an OIDC session */
      manageOIDCSession();
    } else props.history.push('/login');
  }, []);

  useEffect(() => {
    if (api.user.current.id_token !== '') {
      let path = initialPath.current.split('/')[1];
      if (path === 'login' || path === 'callback' || path === 'error')
        props.history.push('/');
      else props.history.push(initialPath.current);
    }
  }, [api]);

  /** Remove everything and redirect to the login page */
  const tokenLogout = () => {
    Utils().removeCookie();
    if (!window.OIDC_PROVIDER_URL) {
      window.api = ApiInterface({ id_token: '' });
      api.setUser({ id_token: '' });
      setApi({ ...api });
      props.history.push('/login');
    } else return authManager.current.logout();
  };

  const setGlobalConfig = () => {
    /** global notification config */
    notification.config({
      placement: 'bottomLeft',
      bottom: 30,
      duration: 3
    });

    /** global message config */
    message.config({
      top: 0,
      duration: 2,
      maxCount: 1
    });
  };

  const manageToken = token => {
    if (api.user.current.id_token !== '') return;
    let user = { id_token: token };
    let _api = ApiInterface(user, tokenLogout);
    try {
      Utils().parseJWT(token);
      _api.loadDashboardCRs('DashboardConfig');
      _api.loadDashboardCRs('View');
      window.api = _api;
      window.api.DCArrayCallback.current.push(() =>
        setConfig(window.api.dashConfigs.current)
      );
      setApi(_api);
      message.success('Successfully logged in');
      Utils().setCookie(token);

      /** Get the CRDs at the start of the app */
      _api.getCRDs().catch(error => {
        console.log(error);
      });
    } catch (error) {
      tokenLogout();
    }
  };

  const manageOIDCSession = () => {
    authManager.current.manager.events.addUserLoaded(user => {
      manageToken(user.id_token);
    });

    /** Refresh token (or logout is silent sign in is not enabled) */
    authManager.current.manager.events.addAccessTokenExpiring(() => {
      authManager.current.manager
        .signinSilent()
        .then(user => {
          Utils().removeCookie();
          window.api = ApiInterface(user, tokenLogout);
          Utils().setCookie(user.id_token);
        })
        .catch(() => tokenLogout());
    });
  };

  /** Always present routes */
  let routes = [
    <Route
      key={'login'}
      exact
      path="/login"
      render={props => {
        return window.OIDC_PROVIDER_URL && !Cookies.get('token') ? (
          <CallBackHandler func={authManager.current.login} />
        ) : (
          <Login {...props} func={manageToken} />
        );
      }}
    />,
    <Route
      key={'callback'}
      path="/callback"
      render={() => {
        return window.OIDC_PROVIDER_URL && !Cookies.get('token') ? (
          <CallBackHandler func={authManager.current.completeLogin} />
        ) : (
          <Redirect to="/" />
        );
      }}
    />,
    <Route key={'logout'} exact path="/logout">
      <Redirect to="/login" />
    </Route>,
    <Route
      key={'error'}
      exact
      path="/error/:statusCode"
      component={props => (
        <ErrorRedirect {...props} tokenLogout={tokenLogout} />
      )}
    />
  ];

  /** Routes present only if logged in and apiManager created */
  if (api.user.current.id_token !== '') {
    if (
      !_.isEmpty(window.api.dashConfigs.current) &&
      window.api.dashConfigs.current.spec.plugin
    ) {
      window.api.dashConfigs.current.spec.plugin.forEach(plugin => {
        if (plugin.enabled && plugin.URL && plugin.path) {
          routes.push(
            <Route
              key={plugin.URL}
              exact
              path={plugin.URL}
              render={() => <PluginLoader resourcePath={plugin.path} />}
            />
          );
        }
      });
    }

    routes.push(
      DefaultRoutes(),
      <Route
        key={'other'}
        component={() =>
          !_.isEmpty(window.api.dashConfigs.current) ? (
            <ErrorRedirect
              match={{ params: { statusCode: '404' } }}
              tokenLogout={tokenLogout}
            />
          ) : (
            <LoadingIndicator />
          )
        }
      />
    );
  } else {
    routes.push(
      <Route
        key={'other'}
        render={() =>
          window.OIDC_PROVIDER_URL && !Cookies.get('token') ? (
            <Redirect to={'/login'} />
          ) : (
            <LoadingIndicator />
          )
        }
      />
    );
  }

  return (
    <Layout style={{ height: '100vh' }}>
      {api.user.current.id_token !== '' ? <SideBar /> : null}
      <Layout>
        {api.user.current.id_token !== '' ? (
          <AppHeader
            tokenLogout={tokenLogout}
            logged={api.user.current.id_token !== ''}
          />
        ) : null}
        <Layout.Content className="app-content">
          <Switch>{routes}</Switch>
        </Layout.Content>
        {api.user.current.id_token !== '' ? <AppFooter /> : null}
      </Layout>
    </Layout>
  );
}

export default withRouter(App);
