import React, { useState } from 'react';
import { SketchPicker, ChromePicker } from 'react-color';
import { Col, Input, Popover, Row } from 'antd';
import { EditOutlined } from '@ant-design/icons';

export default function ColorPicker(props){
  const [color, setColor] = useState(props.color);

  const onChange = _color => {
    setColor(_color.hex);
    props.updateFunc(props.parameter, _color.hex);
  }

  const styles = {
    color: {
      width: '16px',
      height: '16px',
      borderRadius: '2px',
      background: color
    },
    swatch: {
      padding: '4px',
      background: '#fff',
      borderRadius: '2px',
      boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
      display: 'inline-block',
      cursor: 'pointer'
    }
  };

  const content = (
    <div style={{color: 'black'}}>
      <SketchPicker color={color} onChange={onChange} />
    </div>
  )

  return(
    <Popover trigger={'click'} content={content}>
      <div style={{width: 16, height: 16, borderRadius: 2, background: color}}>
        <div style={styles.swatch}>
          <div style={styles.color}/>
        </div>
      </div>
    </Popover>
  )
}
