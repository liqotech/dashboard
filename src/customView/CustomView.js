import React, { useState, useEffect, useRef } from 'react';
import './CustomView.css';
import LoadingIndicator from '../common/LoadingIndicator';
import ResourceList from '../resources/resourceList/ResourceList';
import ResourceGeneral from '../resources/resource/ResourceGeneral';
import { Badge } from 'antd';
import CustomViewHeader from './CustomViewHeader';
import DraggableLayout from '../widgets/draggableLayout/DraggableLayout';
import { Link } from 'react-router-dom';


function CustomView(props) {

  const [resourceView, setResourceView] = useState([]);
  const CV = useRef();

  useEffect(() => {
    window.api.CVArrayCallback.current.push(getCustomViews);
    CV.current = props.customView;
    getCustomViews();

    return () => {
      /** Cancel all callback for the resources */
      window.api.CVArrayCallback.current = window.api.CVArrayCallback.current.filter(func => {
        return func !== getCustomViews;
      });
    }
  }, [props.customView])

  const getParams = path => {
    let array = path.split('/');
    if (array[1] === 'apis') {
      return {
        group: array[2],
        version: array[3],
        namespace: array[4] === 'namespaces' ? array[5] : undefined,
        resource: array[4] === 'namespaces' ? array[6] : array[4],
        resourceName: array[4] === 'namespaces' ? array[7] : array[5]
      }
    } else {
      return {
        group: undefined,
        version: array[2],
        namespace: array[3] === 'namespaces' ? array[4] : undefined,
        resource: array[3] === 'namespaces' ? array[5] : array[3],
        resourceName: array[4] === 'namespaces' ? array[6] : array[4]
      }
    }
  }

  const loadResource = () => {
    CV.current.spec.resources.forEach(item => {
      let par = getParams(item.resourcePath);
      setResourceView(prev => {
        if(prev.find(child => child.key === item.resourcePath))
          return prev;

        prev.push(
          <div data-grid={item.layout}
               title={
                 <Link to={item.resourcePath}>
                   <Badge text={item.resourceName ? item.resourceName : item.resourcePath} color={'blue'} />
                 </Link>
               }
               key={item.resourcePath}
          >
            {par.resourceName ? (
              <div style={{marginTop: 66}}>
                <ResourceGeneral onRef={{}}
                                 _location={{
                                   pathname: item.resourcePath
                                 }}
                                 _params={par}
                                 key={'custom_view_ref_' + item.resourcePath}
                />
              </div>
            ) : (
              <ResourceList onRef={{}}
                            _location={{
                              pathname: item.resourcePath
                            }}
                            _params={par}
                            key={'custom_view_ref_' + item.resourcePath}
              />
            )}
          </div>
        );

        return [...prev]
      });
    });
  }

  /** Update the custom views */
  const getCustomViews = () => {
    CV.current = window.api.customViews.current.find(item => {
      return item.metadata.name === CV.current.metadata.name;
    })

    if(CV.current)
      loadResource();
  }

  return (
    CV.current ? (
        <div>
          <CustomViewHeader customView={CV.current} />
          <DraggableLayout customView={CV.current}
                           saveOnLayoutChange
          >
            {resourceView}
          </DraggableLayout>
        </div>
    ) : <LoadingIndicator />
  );
}

export default CustomView;
