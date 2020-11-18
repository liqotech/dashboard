import React from 'react';

export default function CustomIcon(props){
  const Icon = ({type, ...rest}) => {
    const icons = require(`@ant-design/icons`);
    let Component = icons[type];
    if(!Component)
      Component = icons['CloseOutlined'];
    return <Component {...rest} />;
  }

  return <Icon type={props.icon ? props.icon : 'ApiOutlined'} style={{fontSize: props.size}} {...props} />
}
