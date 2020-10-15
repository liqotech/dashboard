import { Dropdown, Menu, message, Tooltip } from 'antd';
import AddCustomView from '../../../views/AddCustomView';
import React, { useEffect, useState } from 'react';
import LayoutOutlined from '@ant-design/icons/lib/icons/LayoutOutlined';

export default function CustomViewButton(props){
  let [customViews, setCustomViews] = useState([]);

  useEffect(() => {
    /** Set a callback to keep track of custom view's update */
    window.api.CVArrayCallback.current.push(getCustomViews);
    /** Get the custom views */
    customViews = window.api.customViews.current;

    return () => {
      window.api.CVArrayCallback.current = window.api.CVArrayCallback.current.filter(func => {return func !== getCustomViews});
    }
  }, [])

  /** Update the custom views */
  const getCustomViews = () => {
    setCustomViews([...window.api.customViews.current]);
  }

  /** check if this resource is already in a custom view */
  const checkAlreadyInView = (e) => {
    let cv = window.api.customViews.current.find(item => {
      return item.metadata.name === e;
    });

    if(cv.spec.crds){
      return !!cv.spec.crds.find(item => {
        if(item)
          return item.crdName === props.resource.metadata.name;
      });
    }
  }

  /** Update the custom view CR and include this resource */
  const handleClick_addToView = (e) => {
    let cv = window.api.customViews.current.find(item => {
      return item.metadata.name === e.key;
    });
    let index = -1;

    if(cv.spec.crds){
      /** Search if the resource is in the view */
      index = cv.spec.crds.indexOf(
        cv.spec.crds.find(item => {
          if(item)
            return item.crdName === props.resource.metadata.name;
        }));
    } else {
      cv.spec.crds = [];
    }

    /** If the resource is in the view, remove it
     *  or else, add it in the view
     */
    if(index !== -1){
      cv.spec.crds[index] = null;
    } else {
      cv.spec.crds.push({
        crdName: props.resource.metadata.name
      });
    }

    let array = cv.metadata.selfLink.split('/');
    let promise = window.api.updateCustomResource(
      array[2],
      array[3],
      array[5],
      array[6],
      array[7],
      cv
    );

    promise
      .then(() => {
        message.success('Resource updated');
      })
      .catch((error) => {
        console.log(error)
        message.error('Could not update the resource');
      });
  }

  const items = [];

  window.api.customViews.current.forEach(item => {
    items.push(
      <Menu.Item key={item.metadata.name} onClick={handleClick_addToView}>
        {
          item.spec.viewName ? (
            <span style={checkAlreadyInView(item.metadata.name) ? {
              color: 'red'
            } : null}>{ item.spec.viewName }</span>
          ) : (
            <span style={checkAlreadyInView(item.metadata.name) ? {
              color: 'red'
            } : null}>{ item.metadata.name }</span>
          )
        }
      </Menu.Item>
    )
  });

  if(items.length === 0){
    items.push(
      <Menu.Item key={'no-item'}>No custom views</Menu.Item>
    )
  }

  const menu = (
    <Menu>
      {items}
      <Menu.Item key="addCV">
        <AddCustomView selected={props.resource.metadata.name}/>
      </Menu.Item>
    </Menu>
  );

  return (
    <Tooltip title={'Add or Remove to View'} placement={'topLeft'}>
      <Dropdown.Button overlay={menu} placement="bottomCenter"
                       style={{paddingTop: 6}}
                       trigger={['click']} icon={<LayoutOutlined />} />
    </Tooltip>
  )
}
