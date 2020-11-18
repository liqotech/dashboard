import React, { Suspense, useEffect, useRef, useState } from 'react';
import CustomView from './CustomView';
import LoadingIndicator from '../common/LoadingIndicator';
import { Alert } from 'antd';

export default function CustomViewLoader(props){
  const [Component, setComponent] = useState(null);
  const [customView, setCustomView] = useState(null);

  useEffect(() => {
    window.api.CVArrayCallback.current.push(getCustomViews);
    getCustomViews();
  }, [props.match]);

  const getCustomViews = () => {
    let _customView = window.api.customViews.current.find(item => {
      return item.metadata.name === props.match.params.viewName;
    })

    if(_customView && (!customView || _customView.metadata.resourceVersion !== customView.metadata.resourceVersion)){
      if(_customView.spec.component){
        _customView.spec.resources.forEach(res => {
          setComponent(React.lazy(() => import('./' + res.resourcePath + (res.resourcePath.slice(-3) === '.js' ? '' : '.js'))));
        })
      }
      setCustomView(_customView);
    }
  }

  return(
    customView ?
      customView.spec.component ? (
        <Alert.ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            {Component ? <Component /> : null}
          </Suspense>
        </Alert.ErrorBoundary>
      ) : (
        <Alert.ErrorBoundary>
          <CustomView {...props} />
        </Alert.ErrorBoundary>
      ) :
      <LoadingIndicator />
  )
}
