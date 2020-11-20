import React, { Suspense, useEffect, useRef, useState } from 'react';
import CustomView from './CustomView';
import LoadingIndicator from '../common/LoadingIndicator';
import { Alert } from 'antd';

export default function PluginLoader(props){
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    setComponent(React.lazy(() => import('./' + props.resourcePath + '.js')));
  }, [props.match])

  return(
    <Alert.ErrorBoundary>
      <Suspense fallback={<LoadingIndicator />}>
        {Component ? <Component /> : null}
      </Suspense>
    </Alert.ErrorBoundary>
  )
}
