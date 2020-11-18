import { Route } from 'react-router-dom';
import Home from '../../../views/liqo/Home';
import CRD from '../../../resources/CRD/CRD';
import CustomViewLoader from '../../../views/CustomViewLoader';
import APIGroupList from '../../../resources/APIGroup/APIGroupList';
import APIResourceList from '../../../resources/APIResourceList/APIResourceList';
import ResourceList from '../../../resources/resourceList/ResourceList';
import ResourceGeneral from '../../../resources/resource/ResourceGeneral';
import React from 'react';
import ConfigView from '../../../views/configView/ConfigView';

export default function DefaultRoutes(){
  return [
    <Route key={'home'}
           exact path="/"
           render={(props) =>
             <Home {...props} />
           }/>,
    <Route key={'crd'}
           exact path="/customresources/:crdName"
           render={(props) =>
             <CRD {...props} />
           }/>,
    <Route key={'customview'}
           exact path="/customview/:viewName/"
           render={(props) =>
             <CustomViewLoader {...props} />
           }/>,
    <Route key={'api'}
           exact path={'/apis'}
           render={(props) =>
             < APIGroupList {...props} />
           }/>,
    <Route key={'APIV1ResourceList'}
           exact path={'/api/:version'}
           render={(props) =>
             < APIResourceList {...props} />
           }/>,
    <Route key={'APIResourceList'}
           exact path={'/apis/:group/:version'}
           render={(props) =>
             < APIResourceList {...props} />
           }/>,
    <Route key={'ResourceListNamespaced'}
           exact path={'/apis/:group/:version/namespaces/:namespace/:resource'}
           render={(props) =>
             < ResourceList {...props} />
           }/>,
    <Route key={'ResourceListNamespacedAPIV1'}
           exact path={'/api/:version/namespaces/:namespace/:resource'}
           render={(props) =>
             < ResourceList {...props} />
           }/>,
    <Route key={'ResourceList'}
           exact path={'/apis/:group/:version/:resource'}
           render={(props) =>
             < ResourceList {...props} />
           }/>,
    <Route key={'ResourceListAPIV1'}
           exact path={'/api/:version/:resource'}
           render={(props) =>
             < ResourceList {...props} />
           }/>,
    <Route key={'Resource'}
           exact path={'/apis/:group/:version/:resource/:resourceName'}
           render={(props) =>
             < ResourceGeneral {...props} />
           }/>,
    <Route key={'ResourceAPIV1'}
           exact path={'/api/:version/:resource/:resourceName'}
           render={(props) =>
             < ResourceGeneral {...props} />
           }/>,
    <Route key={'ResourceNamespaced'}
           exact path={'/apis/:group/:version/namespaces/:namespace/:resource/:resourceName'}
           render={(props) =>
             < ResourceGeneral {...props} />
           }/>,
    <Route key={'ResourceNamespacedAPIV1'}
           exact path={'/api/:version/namespaces/:namespace/:resource/:resourceName'}
           render={(props) =>
             < ResourceGeneral {...props} />
           }/>,
    <Route key={'settings'}
           exact path="/settings"
           render={(props) =>
             <ConfigView {...props} />
           }/>,
  ]
}
