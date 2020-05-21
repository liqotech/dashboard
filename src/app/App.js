import React, { Component } from 'react';
import './App.css';
import {
  Route,
  withRouter,
  Switch
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

const { Content } = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    notification.config({
      placement: 'bottomLeft',
      bottom: 20,
      duration: 3,
    });
    this.api = new ApiManager();
    this.api.watcherSchedulerRR();
  }

  render() {

    return (
        <Layout>
          <AppHeader api={this.api} />
          <Layout className="app-content" style={{minHeight: '92vh'}}>
            <SideBar api={this.api} />
            <Layout style={{ marginLeft: 250 }}>
              <Content>
                <div className="container">
                  <Switch>
                    <Route exact path="/"
                           render={(props) => <DashboardGeneral {...props} api={this.api} />}/>
                    <Route exact path="/customresources"
                           render={(props) => <CRDList {...props} api={this.api} />}/>
                    <Route exact path="/customresources/:crdName"
                           component={(props) => <CRD {...props} api={this.api} />}/>
                    <Route exact path="/customresources/:crdName/create"
                           render={(props) => <NewCR {...props} api={this.api} />}/>
                    <Route exact path="/customresources/:crdName/representation_editor"
                           render={(props) => <DesignEditorCRD {...props} api={this.api} />}/>
                    <Route exact path="/customresources/:crdName/:crName/update"
                           render={(props) => <UpdateCR {...props} api={this.api} />}/>
                    <Route exact path="/customview/:viewName/"
                           component={(props) => <CustomView {...props} api={this.api} />}/>
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
