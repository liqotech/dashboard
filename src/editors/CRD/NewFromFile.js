import { Button, message, Row, Col, Table, Tooltip, Upload, Badge } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  InboxOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import Utils from '../../services/Utils';
import _ from 'lodash';
import { getColumnSearchProps } from '../../services/TableUtils';
import { getNamespaced } from '../../resources/common/ResourceUtils';
import NamespaceSelect from '../../common/NamespaceSelect';

export default function NewFromFile(props){
  const [fileContent, setFileContent] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [selectedContent, setSelectedContent] = useState([]);
  const [namespaced, setNamespaced] = useState(false);
  const [namespace, setNamespace] = useState('default');

  useEffect(() => {
    getNamespaced(props.genericResource.metadata.selfLink)
      .then(res => setNamespaced(res));
  }, []);

  useEffect(() => {

    setColumnHeaders([{
      dataIndex: 'uploaded',
      key: 'uploaded',
      align: 'center',
      fixed: true,
      title: <InboxOutlined />,
      render: (text) => {
        if(text){
          if(text === 1)
            return (
              <Tooltip title={'Uploading'} >
                <LoadingOutlined />
              </Tooltip>
            )
          else if(text === 2)
            return (
              <Tooltip title={'Uploaded'} >
                <CheckOutlined />
              </Tooltip>
            )
          else if(text === 3)
            return (
              <Tooltip title={'Not Uploaded'} >
                <CloseOutlined />
              </Tooltip>
            )
        } else return (
          <Tooltip title={'Ready to be uploaded'} >
            <UploadOutlined />
          </Tooltip>
        )
      }
    }]);
    _.keys(fileContent[0]).forEach(key => {
      if(key !== 'key' && key !== 'uploaded')
        setColumnHeaders(prev => {
          prev.push(
            {
              dataIndex: key,
              key: key,
              title: <div style={{marginLeft: '2em'}}>{key}</div>,
              ...getColumnSearchProps(key, (text) =>
                <div>{text}</div>
              ),
            },
          )
          return [...prev];
        })
    })
  }, [fileContent])

  const submitResource = (item, name) => {
    let resource = {
      apiVersion: props.genericResource.apiVersion,
      kind: props.kind,
      metadata: {
        name: name,
      },
      spec: item
    }

    if(namespaced){
      resource.metadata.namespace = namespace;
    }

    setFileContent(prev => {
      prev.find(item => item.key === name).uploaded = 1;
      return [...prev]
    })

    props.addFunction(resource)
      .then(res => {
        setFileContent(prev => {
          prev.find(item => item.key === name).uploaded = 2;
          return [...prev]
        })
      })
      .catch(() => {
        setFileContent(prev => {
          prev.find(item => item.key === name).uploaded = 3;
          return [...prev]
        })
        message.error('Could not create the resource');
      });
  }

  const customRequest = info => {
    const name = _.lowerCase(props.kind) + '-' + info.file.uid.split('-')[2];
    const reader = new FileReader();
    reader.onload = e => {
      Utils().csvToJson(e.target.result).then(res => {
        let counter = 0;

        res.forEach(item => {
          item.key = name + '-' + counter;
          counter++;
        })

        /**
         * The json file can be customized before the submit.
         * To change the name assigned to each resource, change the item.key parameter.
         */
        if(window.customCSVParser)
          res = window.customCSVParser(res);

        setFileContent([...fileContent, ...res]);
      });
    }
    reader.readAsText(info.file);
  }

  const uploadFile = () => {
    let content;

    if(selectedContent.length > 0)
      content = selectedContent;
    else content = fileContent;

    content.forEach(item => {
      submitResource(item, item.key);
    })
  }

  const uploadProps = {
    multiple: true,
    showUploadList: false
  }

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedContent(selectedRows);
    }
  };

  return(
    <div>
      <Upload.Dragger name={'file_'}
                      style={{marginBottom: 20}}
                      customRequest={customRequest}
                      {...uploadProps}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
      </Upload.Dragger>
      {namespaced ? (
        <Row align={'middle'} gutter={[20, 20]}>
          <Col>
            <Tooltip placement="top" title={'Field required'}>
              <Badge color={'red'}/>
            </Tooltip>
            Namespace
            <Tooltip placement="top" title={'Select the namespace for the resources'}>
              <QuestionCircleOutlined style={{ marginLeft: 5 }}/>
            </Tooltip>
          </Col>
          <Col>
            <NamespaceSelect bordered
                             defaultNS={'default'}
                             style={{width: '100%'}}
                             handleChangeNS={(item) => {
                               setNamespace(item)
                             }}
            />
          </Col>
        </Row>
      ) : null}
      <Table columns={columnHeaders}
             rowSelection={{
               type: 'checkbox',
               ...rowSelection,
             }}
             dataSource={fileContent} size={'small'}
             bordered scroll={{ x: 'max-content' }} sticky
             pagination={{ position: ['bottomCenter'],
               hideOnSinglePage: fileContent.length < 11,
               showSizeChanger: true,
             }} showSorterTooltip={false}
      />
      <Button style={{marginTop: 20}} block icon={<UploadOutlined />} type={'primary'}
              onClick={uploadFile}
      >
        {'Import ' + (selectedContent.length === 0 ? 'All' : 'Selected') }
      </Button>
    </div>
  )
}
