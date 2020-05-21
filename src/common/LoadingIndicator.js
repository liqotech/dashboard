import React from 'react';
import { Spin } from 'antd';
import Icon from 'antd/lib/icon';

export default function LoadingIndicator(props) {
  return (
    <Spin
      size={'large'}
      style={{ display: 'block', textAlign: 'center', marginTop: '15%' }}
    />
  );
}
