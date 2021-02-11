import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Upload } from 'antd';

export default function ThemeUploader(props) {
  const customRequest = info => {
    const reader = new FileReader();
    reader.onload = e => {
      const theme = JSON.parse(e.target.result.toString());
      window.less.modifyVars(theme).then(() => {
        localStorage.setItem('theme', e.target.result.toString());
        props.changeItems(theme);
      });
    };
    reader.readAsText(info.file);
  };

  return (
    <div style={{ width: 150 }}>
      <Upload.Dragger
        name={'file_'}
        customRequest={customRequest}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Drag to upload</p>
      </Upload.Dragger>
    </div>
  );
}
