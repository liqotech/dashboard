import React, { Suspense, useEffect, useRef, useState } from 'react';
import LoadingIndicator from '../common/LoadingIndicator';
import { Alert } from 'antd';
import CustomView from '../customView/CustomView';

export default function CustomViewLoader(props){
  const [Component, setComponent] = useState(null);
  const [customView, setCustomView] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    }
  })

  useEffect(() => {
    window.api.CVArrayCallback.current.push(getCustomViews);
    getCustomViews();
  }, [props.match]);

  const getCustomViews = () => {
    let _customView = window.api.customViews.current.find(item => {
      return item.metadata.name === props.match.params.viewName;
    })
    if(_customView && _customView.spec.enabled &&
      (!customView || _customView.metadata.resourceVersion !== customView.metadata.resourceVersion)){
      if(_customView.spec.component){
        _customView.spec.resources.forEach(res => {
          if(isMounted.current)
            setComponent(React.lazy(() => import('./' + res.resourcePath + (res.resourcePath.slice(-3) === '.js' ? '' : '.js'))));
        })
      }
      if(isMounted.current)
        setCustomView(_customView);
    }
  }

  return(
    customView ?
      customView.spec.component ? (
        <Alert.ErrorBoundary>
          <Suspense fallback={<LoadingIndicator />}>
            {Component ? <Component /> : null}
          </Suspense>
        </Alert.ErrorBoundary>
      ) : (
        <Alert.ErrorBoundary>
          <CustomView {...props} customView={customView} />
        </Alert.ErrorBoundary>
      ) :
      <LoadingIndicator />
  )
}
