import AceEditor from 'react-ace';
import { Button, message } from 'antd';
import React, { useEffect, useState } from 'react';
import YAML from 'yaml';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-dawn';

export default function Editor(props){
  const [value, setValue] = useState('');

  const onClick = () => {
    let item;

    try {
      item = JSON.parse(value);
    } catch(error) {
      try {
        item = YAML.parse(value);
      } catch(error){
        message.error('JSON or YAML not valid');
        return;
      }
    }

    props.onClick(item);
  }

  useEffect(() => {
    setValue(props.value ? props.value : '');
  }, [props.value])

  const onChange = (value) => {
    setValue(value);
  }

  return (
    <div>
      <AceEditor
        mode={'json'}
        theme="dawn"
        fontSize={16}
        value={value}
        readOnly={!props.onClick}
        placeholder={props.placeholder}
        onChange={props.onClick ? onChange : null}
        highlightActiveLine
        showLineNumbers
        tabSize={2}
        height={'72vh'}
        width={'auto'}
        setOptions={{
          useWorker: false
        }}
      />
      {props.onClick ? (
        <div style={{marginTop: 20}}>
          <Button type={'primary'} onClick={onClick} style={{width: "20%"}}>Save</Button>
        </div>
      ) : null}
    </div>
  )
}
