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
import { Layout, notification } from 'antd';
import DashboardGeneral from '../dashboard/DashboardGeneral';
import NewCR from '../editors/NewCR';
import CustomView from '../views/CustomView'
import UpdateCR from '../editors/UpdateCR';
import ApiManager from '../services/ApiManager';
import CRD from '../CRD/CRD';
import DesignEditorCRD from '../editors/DesignEditorCRD';
import Authenticator from '../services/Authenticator';

const { Content } = Layout;

function CallBackHandler(props) {
  props.func()
  return <div></div>
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logged: false,
      api: null,
      user: {}
    }
    notification.config({
      placement: 'bottomLeft',
      bottom: 20,
      duration: 3,
    });
    this.api = null;
    /* Check if previously logged */
    const retrievedSessionToken = JSON.parse(
      sessionStorage.getItem(`oidc.user:${OIDC_PROVIDER_URL}:${OIDC_CLIENT_ID}`)
    );
    if (retrievedSessionToken) {
      this.state = {
        user: retrievedSessionToken.profile,
        logged: true,
        api: new ApiManager({ id_token: retrievedSessionToken.id_token,
          token_type: retrievedSessionToken.token_type || 'Bearer'})
      };
    }
    this.authManager = new Authenticator();
    this.authManager.manager.events.addUserLoaded(user => {
      this.setState({
        logged: true,
        api: new ApiManager(user),
        user: user.profile
      });
      this.state.api.watcherSchedulerRR();
    });
    this.authManager.manager.events.addAccessTokenExpiring(() => {
      this.authManager.manager.signinSilent().then(user => {
        this.setState({logged: true});
      });
    });
  }

  render() {

    return (
        <Layout>
          <AppHeader
            api={this.state.api}
            logout={this.authManager.logout}
            logged={this.state.logged}
          />
          <Layout className="app-content" style={{minHeight: '92vh'}}>
            <SideBar api={this.state.api} />
            <Layout style={{ marginLeft: 250 }}>
              <Content>
                <div className="container">
                  <Switch>
                    <Route exact path="/login"
                           render={() => {
                             this.authManager.login();
                           }}
                    />
                    <Route path="/callback"
                           render={() => this.state.logged ? (
                             <Redirect to="/" />
                             ) : ( <CallBackHandler func={this.authManager.completeLogin} />)}
                    />
                    <Route exact path="/"
                           render={(props) => this.state.logged ? (
                             <DashboardGeneral {...props} api={this.state.api} user={this.state.user}/>
                           ): (<Redirect to = "/login"/>)}/>
                    <Route exact path="/customresources"
                           render={(props) => this.state.logged ? (
                             <CRDList {...props} api={this.state.api} />
                           ): (<Redirect to = "/login"/>)}/>
                    <Route exact path="/customresources/:crdName"
                           component={(props) => this.state.logged ? (
                             <CRD {...props} api={this.state.api} />
                           ): (<Redirect to = "/login"/>)}/>
                    <Route exact path="/customresources/:crdName/create"
                           render={(props) => this.state.logged ? (
                             <NewCR {...props} api={this.state.api} />
                           ): (<Redirect to = "/login"/>)}/>
                    <Route exact path="/customresources/:crdName/representation_editor"
                           render={(props) => this.state.logged ? (
                             <DesignEditorCRD {...props} api={this.state.api} />
                           ): (<Redirect to = "/login"/>)}/>
                    <Route exact path="/customresources/:crdName/:crName/update"
                           render={(props) => this.state.logged ? (
                             <UpdateCR {...props} api={this.state.api} />
                           ): (<Redirect to = "/login"/>)}/>
                    <Route exact path="/customview/:viewName/"
                           component={(props) => this.state.logged ? (
                             <CustomView {...props} api={this.state.api} />
                           ): (<Redirect to = "/login"/>)}/>
                    <Route path="*">
                      <Redirect to="/login" />
                    </Route>
                  </Switch>
                </div>
              </Content>
              <AppFooter />
            </Layout>
          </Layout>
        </Layout>
    );
  }
}

export default withRouter(App);
