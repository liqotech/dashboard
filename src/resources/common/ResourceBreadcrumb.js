import { Breadcrumb } from 'antd';
import React from 'react';
import { useParams, useHistory, useLocation } from "react-router-dom";
import {HomeOutlined} from '@ant-design/icons';

export default function ResourceBreadcrumb(props){
  let params = useParams();
  let history = useHistory();
  let location = useLocation();
  let breads = [];

  function onClickApi() {
    let path = '/' + location.pathname.split('/')[1];
    if(!params.group)
      path = path + '/' + params.version;
    history.push(path)
  }

  breads.push(
    <Breadcrumb.Item key={location.pathname.split('/')[1]} onClick={onClickApi}>
      <a>
        {location.pathname.split('/')[1]}
      </a>
    </Breadcrumb.Item>
  )

  function onClickGroup() {
    let path = '/' + location.pathname.split('/')[1] + '/' + params.group + '/' + params.version;
    history.push(path)
  }

  if(params.group){
    breads.push(
      <Breadcrumb.Item key={params.group} onClick={onClickGroup}>
        <a>
          {params.group}
        </a>
      </Breadcrumb.Item>
    )
  }

  function onClickResource() {
    let path = '/' + location.pathname.split('/')[1] + '/' +
      (params.group ? params.group + '/' : '') +
      params.version + '/' + params.resource;
    history.push(path)
  }

  if(params.resource){
    breads.push(
      <Breadcrumb.Item key={params.resource} onClick={onClickResource}>
        <a>
          {params.resource}
        </a>
      </Breadcrumb.Item>
    )
  }

  if(params.resourceName){
    breads.push(
      <Breadcrumb.Item key={params.resourceName} />
    )
  }

  delete breads[breads.length - 1];

  return(
    <Breadcrumb>
      <Breadcrumb.Item onClick={() => history.push('/')}>
        <a><HomeOutlined /></a>
      </Breadcrumb.Item>
      {breads}
      <Breadcrumb.Item>
        <span/>
      </Breadcrumb.Item>
    </Breadcrumb>
  )
}
