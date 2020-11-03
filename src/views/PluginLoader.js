import React, { Suspense, useEffect, useState } from 'react';
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
