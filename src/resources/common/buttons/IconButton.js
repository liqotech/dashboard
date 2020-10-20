import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, List, Modal, Tooltip, Typography } from 'antd';
import { splitCamelCaseAndUp } from '../../../services/stringUtils';
import {SearchOutlined} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import CustomIcon from '../CustomIcon';

export default function IconButton(props){
  let params = useParams();

  const [icons, setIcons] = useState([])
  const totalIcons = useRef([]);

  useEffect(() => {
    const iconsArray = [];
    const _icons = require(`@ant-design/icons`);
    for(let key in _icons){
      if(_icons.hasOwnProperty(key)){
        if(key !== 'setTwoToneColor' &&
          key !== 'getTwoToneColor' &&
          key !== 'createFromIconfontCN' &&
          key.includes('Outlined')
        ){
          iconsArray.push({
            key: key,
            icon: (<div key={key}>
              <Button onClick={() => {
                        props.setIcon(key);
                        setIcons(totalIcons.current);
                      }}
                      style={{ width: '7em', height: '7em', border: 'none', boxShadow: 'none' }}
                      icon={<CustomIcon icon={key} size={32} />}
              />
              <div style={{ textAlign: 'center' }}>
                <Typography.Text strong >
                  {splitCamelCaseAndUp(key).replace(' Outlined', '')}
                </Typography.Text>
              </div>
            </div>)
          })
        }
      }
    }

    setIcons(iconsArray);
    totalIcons.current = iconsArray;
  }, [params]);

  const onChange = (value) => {
    let searched = totalIcons.current.filter(icon => icon.key.toUpperCase()
      .includes(value.toUpperCase().replace(' ', '')));
    setIcons(searched);
  }

  return(
    <Modal title={'Icons'}
           centered
           footer={null}
           visible={props.onAddIcon}
           onCancel={() => {
             setIcons(totalIcons.current);
             props.setOnAddIcon(false);
           }}
           destroyOnClose
    >
      <div style={{height: '70vh', overflow: 'auto'}}>
        <div style={{marginBottom: 4}}>
          <Input
            role={'input'}
            placeholder="Search icon"
            suffix={
              <SearchOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
            }
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <List
          grid={{ gutter: 0, column: 4 }}
          dataSource={icons}
          renderItem={item => (
            <div>{item.icon}</div>
          )}
          pagination={{
            showSizeChanger: false,
            pageSize: 16,
          }}
        />
      </div>
    </Modal>
  )
}

