import React, { Component } from 'react';
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

function CallBackHandler(props) {
  props.func();
  return <div/>
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logged: false,
      api: null,
      user: {}
    }

    /** Set the URL to which we make the call to the proxy */
    window.APISERVER_URL = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/apiserver';

    /** Manage the login via token */
    this.manageToken = this.manageToken.bind(this);
    /** Manage the logout via token */
    this.tokenLogout = this.tokenLogout.bind(this);

    /** set global configuration for notifications and alert*/
    this.setGlobalConfig();

    this.authManager = new Authenticator();

    if (this.authManager.OIDC) {
      /** all is needed to manage an OIDC session */
      this.manageOIDCSession();
    }
  }


  render() {
    /** Always present routes */
    let routes = [
      <Route key={'login'}
             exact path="/login"
             render={() => this.authManager.OIDC ? (
               <CallBackHandler func={this.authManager.login} />
             ) : <Login func={this.manageToken} logged={this.state.logged} />}
      />,
      <Route key={'callback'}
             path="/callback"
             render={() => this.state.logged ? (
               <Redirect to="/" />
             ) : ( <CallBackHandler func={this.authManager.completeLogin} />)}
      />,
      <Route key={'logout'}
             path="/logout">
        <Redirect to="/login" />
      </Route>,
      <Route key={'error'}
             path="/error/:statusCode"
             component={(props) => <ErrorRedirect {...props} authManager={this.authManager} tokenLogout={this.tokenLogout} />}
      />
    ]

    /** Routes present only if logged in and apiManager created */
    if(this.state.api && this.state.logged){
      routes.push(
        <Route key={'/'}
               exact path="/"
               render={(props) =>
                 <Home {...props} api={this.state.api} user={this.state.user}/>
               }/>,
        <Route key={'customresources'}
               exact path="/customresources"
               component={(props) =>
                 <CRDList {...props} api={this.state.api} />
               }/>,
        <Route key={'crd'}
               exact path="/customresources/:crdName"
               component={(props) =>
                 <CRD {...props} api={this.state.api} />
               }/>,
        <Route key={'customview'}
               exact path="/customview/:viewName/"
               component={(props) =>
                 <CustomView {...props} api={this.state.api} />
               }/>,
        <Route key={'liqonfig'}
               exact path="/settings"
               component={(props) =>
                 <ConfigView {...props} api={this.state.api} />
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
          {this.state.api && this.state.logged ? (
              <SideBar api={this.state.api} />
          ) : null}
          <Layout>
            {this.state.api && this.state.logged ? (
              <AppHeader
                api={this.state.api}
                tokenLogout={this.tokenLogout}
                authManager={this.authManager}
                logged={this.state.logged}
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

  /** Remove everything and redirect to the login page */
  tokenLogout() {
    this.state.logged = false;
    this.state.api = null;
    this.state.user = {};
    Cookies.remove('token');
    this.props.history.push('/login');
  }

  setGlobalConfig() {
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

  manageToken(token){
    if(this.state.logged) return;
    let user = {
      id_token: token
    };
    let api = new ApiManager(user);
    /** Get the CRDs at the start of the app */
    api.getCRDs().
    then(() => {
      api.loadCustomViewsCRs();
      this.setState({
        logged: true,
        api: api,
        user: user
      });
      notification.success({
        message: APP_NAME,
        description: 'Successfully logged in'
      });
      Cookies.set('token', token)
      this.props.history.push('/');
    }).
    catch(error => {
      /** If this first api call fails, this means that the token is not valid */
      notification.error({
        message: APP_NAME,
        description: 'Login failed: token not valid'
      });
      this.tokenLogout();
    })
  }

  manageOIDCSession() {
    /** Check if previously logged */
    const retrievedSessionToken = JSON.parse(
      sessionStorage.getItem(`oidc.user:${OIDC_PROVIDER_URL}:${OIDC_CLIENT_ID}`)
    );
    if (retrievedSessionToken) {
      let api = new ApiManager({ id_token: retrievedSessionToken.id_token,
        token_type: retrievedSessionToken.token_type || 'Bearer'});
      this.state = {
        user: retrievedSessionToken.profile,
        logged: true,
        api: api
      };
      /** Get the CRDs at the start of the app */
      this.state.api.loadCustomViewsCRs();
      this.state.api.getCRDs().catch(error => {
        console.log(error);
        if(error.response._fetchResponse.status)
          this.props.history.push("/error/" + error.response._fetchResponse.status);
      });
    }

    this.authManager.manager.events.addUserLoaded(user => {
      let api = new ApiManager(user);
      this.setState({
        logged: true,
        api: api,
        user: user.profile
      });
      api.loadCustomViewsCRs();
      /** Get the CRDs at the start of the app */
      api.getCRDs().catch(error => {
        console.log(error);
        if(error.response._fetchResponse.status)
          this.props.history.push("/error/" + error.response._fetchResponse.status);
      });
    });

    /** Refresh token (or logout is silent sign in is not enabled) */
    this.authManager.manager.events.addAccessTokenExpiring(() => {
      this.authManager.manager.signinSilent().then(user => {
        this.state.api.refreshConfig(user);
        this.setState({logged: true});
      }).catch((error) => {
        console.log(error);
        localStorage.clear();
        this.props.history.push("/logout");
      });
    });
  }
}

export default withRouter(App);
