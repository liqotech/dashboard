import { Row, Col, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import React from 'react';
import _ from 'lodash';
import { useParams, useLocation } from 'react-router-dom';
import { CheckCircleTwoTone, ExclamationCircleTwoTone } from '@ant-design/icons';

export const renderResourceList = (text, record, dataIndex, resourceList) => {
  let params = useParams();
  let location = useLocation();
  let resource = resourceList.find(item => {return item.metadata.name === record.Name});

  if(Array.isArray(text)){
    if(text.length === 0)
      return 'None';

    let items = [];

    if(typeof text[0] === 'object'){
      items.push(text.length);
    }else{
      let counter = 0;
      text.forEach(item => {
        if (typeof item === "boolean"){
          items.push(
            item ? <CheckCircleTwoTone key={'array_' + record.Name + '_' + item + '_' + counter}
                                       twoToneColor="#52c41a"
            /> : <ExclamationCircleTwoTone key={'array_' + record.Name + '_' + item + '_' + counter}
                                           twoToneColor="#f5222d"
            />
          );
        }
        else {
          items.push(<Tag key={'array_' + record.Name + '_' + item + '_' + counter}>{item}</Tag>);
        }
        counter++;
      })
    }

    return(
      <div>
        {items}
      </div>
    )
  } else if(typeof text === "boolean"){
    return (
      text ? <CheckCircleTwoTone twoToneColor="#52c41a" /> :
        <ExclamationCircleTwoTone twoToneColor="#f5222d" />
    )
  } else if(typeof text === 'object'){
    if(_.isEmpty(text))
      return 'None';

    let items = [];

    for (let key in text) {
      if(text.hasOwnProperty(key)){
        items.push(
          <Row style={{maxWidth: '30em'}} key={'object_' + record.Name + '_' + key}>
            <Col span={12}>
              <div style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                {key}:
              </div>
            </Col>
            <Col span={12}>
              {(typeof text[key] === 'object' || Array.isArray(text[key])) ?
                <Tag>...</Tag> :
                <Tag style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{text[key]}</Tag>
              }
            </Col>
          </Row>
        )
      }
    }

    return(
      <div>{items}</div>
    )
  }

  if(text === '' || !text)
    return 'None';

  return (
    dataIndex === 'Name' ? (
      <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
        pathname: '/' + location.pathname.split('/')[1] + '/' +
          (params.group ? params.group + '/' : '') +
          params.version + '/' +
          (resource.metadata.namespace ? 'namespaces/' + resource.metadata.namespace + '/' : '') +
          params.resource + '/' +
          resource.metadata.name
      }} >
        <Typography.Text strong>{text}</Typography.Text>
      </Link>
    ) : (
      <div>{text}</div>
    )
  )
}
