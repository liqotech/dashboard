import React from 'react';

export default function CustomIcon(props){
  const Icon = ({type, ...rest}) => {
    const icons = require(`@ant-design/icons`);
    const Component = icons[type];
    return <Component {...rest} />;
  }

  return <Icon type={props.icon ? props.icon : 'ApiOutlined'} style={{fontSize: props.size}} />
}
