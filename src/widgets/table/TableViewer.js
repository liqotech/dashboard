import { Modal, Table, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import { ArrowsAltOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import FormViewer from '../form/FormViewer';
import { Link } from 'react-router-dom';

export default function TableViewer(props){
  const columns = [];
  const dataSource = [];
  const form = useRef({form: {}})
  const [showModal, setShowModal] = useState(false);

  if(props.form[props.title].length > 0){
    Object.keys(props.form[props.title][0]).forEach(key => {
      columns.push({
        title: key,
        dataIndex: key,
        key: key,
      })
    })

    let counter = 0;

    props.form[props.title].forEach(item => {
      let row = {};
      row.key = counter;
      Object.keys(item).forEach(key => {
        if(typeof item[key] !== 'object'){
          if(typeof item[key] === 'boolean')
            row[key] = item[key] ? <CheckCircleOutlined style={{color: "#52c41a"}} /> :
              <ExclamationCircleOutlined style={{color: '#ff4d4f'}} />
          else
            row[key] = item[key];
        } else {
          console.log(key, item[key])

          row[key] = (
            <Tooltip title={'Open resource in modal'}>
              <Link onClick={() => {
                form.current.form = item[key]
                setShowModal(true);
              }}>
                {key + ' # ' + counter}
                <ArrowsAltOutlined style={{paddingLeft: 10}}
                                   onClick={() => setShowModal(true)}
                />
              </Link>
            </Tooltip>
          );
        }
      })
      dataSource.push(row)
      counter++;
    })
  }

  return(
    <>
      <Modal
        destroyOnClose
        title={'Viewing Resource'}
        visible={showModal}
        footer={null}
        width={'50%'}
        onCancel={() => setShowModal(false)}
      >
        <div>
          <FormViewer {...props}
                      resource={JSON.parse(JSON.stringify(form.current))} show={'form'}
                      readonly
          />
        </div>
      </Modal>
      <div style={{ margin: -13 }}>
        <Table key={props.title} dataSource={dataSource}
               columns={columns} size={'small'} bordered
               pagination={{
                 size: 'small',
                 hideOnSinglePage: true
               }}
               scroll={{ x: 'max-content' }}
        />
      </div>
    </>

  )
}
