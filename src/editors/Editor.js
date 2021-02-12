import AceEditor from 'react-ace';
import { Button, Card, message } from 'antd';
import React, { useEffect, useState } from 'react';
import YAML from 'yaml';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-dawn';
import 'ace-builds/src-noconflict/theme-monokai';

export default function Editor(props) {
  const initValue = { metadata: { name: '' } };
  const [value, setValue] = useState(JSON.stringify(initValue, null, 2));
  const [valueYAML, setValueYAML] = useState(YAML.stringify(initValue));
  const [currentTab, setCurrentTab] = useState('YAML');

  const onClick = () => {
    let item;

    if (currentTab === 'YAML') {
      try {
        item = YAML.parse(valueYAML);
      } catch (error) {
        message.error('YAML not valid');
        return;
      }
    } else {
      try {
        item = JSON.parse(value);
      } catch (error) {
        message.error('JSON not valid');
        return;
      }
    }

    props.onClick(item);
  };

  useEffect(() => {
    setValue(props.value ? props.value : JSON.stringify(initValue, null, 2));
    setValueYAML(
      props.value
        ? YAML.stringify(JSON.parse(props.value))
        : YAML.stringify(initValue)
    );
  }, [props.value]);

  const onChange = value => {
    if (currentTab === 'YAML') {
      setValueYAML(value);
      try {
        setValue(JSON.stringify(YAML.parse(value), null, 2));
      } catch {}
    } else {
      setValue(value);
      try {
        setValueYAML(YAML.stringify(JSON.parse(value)));
      } catch {}
    }
  };

  return (
    <div>
      <Card
        tabList={[
          {
            key: 'YAML',
            tab: 'YAML'
          },
          {
            key: 'JSON',
            tab: 'JSON'
          }
        ]}
        tabProps={{
          size: 'small'
        }}
        size={'small'}
        type={'inner'}
        activeTabKey={currentTab}
        onTabChange={key => {
          setCurrentTab(key);
        }}
        style={{ overflow: 'hidden' }}
      >
        <AceEditor
          mode={currentTab === 'YAML' ? 'yaml' : 'json'}
          theme={localStorage.getItem('theme') !== 'light' ? 'monokai' : 'dawn'}
          fontSize={16}
          value={currentTab === 'YAML' ? valueYAML : value}
          readOnly={!props.onClick}
          placeholder={props.placeholder}
          onChange={props.onClick ? onChange : null}
          highlightActiveLine
          showLineNumbers
          tabSize={2}
          height={'62vh'}
          width={'auto'}
          setOptions={{
            useWorker: false
          }}
        />
        {props.onClick ? (
          <div style={{ marginTop: 20 }}>
            <Button type={'primary'} onClick={onClick} style={{ width: '20%' }}>
              Save
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
