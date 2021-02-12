import { Row, Col, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import React from 'react';
import _ from 'lodash';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

export const renderResourceList = (text, record, dataIndex, resourceList) => {
  let resource;
  if (record.Namespace)
    resource = resourceList.find(item => {
      return (
        item.metadata.name === record.Name &&
        item.metadata.namespace === record.Namespace
      );
    });
  else
    resource = resourceList.find(item => {
      return item.metadata.name === record.Name;
    });

  if (Array.isArray(text)) {
    if (text.length === 0) return 'None';

    let items = [];

    if (typeof text[0] === 'object') {
      items.push(text.length);
    } else {
      let counter = 0;
      text.forEach(item => {
        if (typeof item === 'boolean') {
          items.push(
            item ? (
              <CheckCircleOutlined
                key={'array_' + record.Name + '_' + item + '_' + counter}
                style={{ color: '#52c41a' }}
              />
            ) : (
              <ExclamationCircleOutlined
                key={'array_' + record.Name + '_' + item + '_' + counter}
                style={{ color: '#ff4d4f' }}
              />
            )
          );
        } else {
          items.push(
            <Tag key={'array_' + record.Name + '_' + item + '_' + counter}>
              {item}
            </Tag>
          );
        }
        counter++;
      });
    }

    return <div>{items}</div>;
  } else if (typeof text === 'boolean') {
    return text ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    );
  } else if (typeof text === 'object') {
    if (_.isEmpty(text)) return 'None';

    let items = [];

    for (let key in text) {
      if (text.hasOwnProperty(key)) {
        items.push(
          <Row
            style={{ maxWidth: '30em' }}
            key={'object_' + record.Name + '_' + key}
          >
            <Col span={12}>
              <div
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {key}:
              </div>
            </Col>
            <Col span={12}>
              {typeof text[key] === 'object' || Array.isArray(text[key]) ? (
                <Tag>...</Tag>
              ) : (
                <Tag
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {text[key]}
                </Tag>
              )}
            </Col>
          </Row>
        );
      }
    }

    return <div>{items}</div>;
  }

  if (text === '' || !text) return 'None';

  return dataIndex === 'Name' ? (
    <Link
      style={{ color: 'rgba(0, 0, 0, 0.85)' }}
      to={{
        pathname: resource.metadata.selfLink
      }}
    >
      <Typography.Text strong>{text}</Typography.Text>
    </Link>
  ) : (
    <div>{text}</div>
  );
};
