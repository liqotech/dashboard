import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

export const renderResourceList = (text, record, dataIndex, resourceList) => {
  let params = useParams();
  let location = useLocation();
  let resource = resourceList.find(item => {return item.metadata.name === record.Name});

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
