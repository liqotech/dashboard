import { Modal, Tabs, Alert } from 'antd';
import React from 'react';
import FormViewer from '../editors/OAPIV3FormGenerator/FormViewer';
import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';

/**
 * Modal that shows the properties of a peering
 * @client: if there is an advertisement
 * @server: if there is a peering request
 * The properties that can be displayed are: Foreign Cluster, Advertisement, Peering Request
 */
export function getPeerProperties(client, server, props, showProperties, setShowProperties){
  return(
    <Modal
      title={'Properties'}
      width={'50vw'}
      visible={showProperties}
      onCancel={() => {setShowProperties(false)}}
      bodyStyle={{paddingTop: 0}}
      footer={null}
      destroyOnClose
    >
      <Tabs>
        <Tabs.TabPane tab={'Foreign Cluster'} key={1}>
          {createTabs('ForeignCluster', props.foreignCluster, props.api)}
        </Tabs.TabPane>
        { client ? (
          <Tabs.TabPane tab={'Advertisement'} key={2}>
            {createTabs('Advertisement', props.advertisements.find(adv =>
              {return adv.metadata.name === props.foreignCluster.status.outgoing.advertisement.name}
            ), props.api)}
          </Tabs.TabPane>
        ) : null }
        { server ? (
          <Tabs.TabPane tab={'Peering Request'} key={4}>
            {createTabs('PeeringRequest', props.peeringRequests.find(pr =>
              {return pr.metadata.name === props.foreignCluster.status.incoming.peeringRequest.name}
            ), props.api)}
          </Tabs.TabPane>
        ) : null }
      </Tabs>
    </Modal>
  )
}

function createTabs(kind, CR, api) {
  let CRD = api.getCRDfromKind(kind);

  return (
    <Tabs tabPosition={'left'} size={'small'} style={{marginLeft: '-1.5em'}} defaultActiveKey={'spec'}>
      <Tabs.TabPane tab={<span>
                            <ToolOutlined />
                            Metadata
                           </span>}
                    key={'metadata'}
      >
        <Alert.ErrorBoundary>
          <FormViewer CRD={CRD}
                      api={api}
                      CR={CR}
                      show={'metadata'}
          />
        </Alert.ErrorBoundary>
      </Tabs.TabPane>
      <Tabs.TabPane tab={<span>
                            <ToolOutlined />
                            Spec
                           </span>}
                    key={'spec'}
      >
        <Alert.ErrorBoundary>
          <FormViewer CRD={CRD}
                      api={api}
                      CR={CR}
                      show={'spec'}
          />
        </Alert.ErrorBoundary>
      </Tabs.TabPane>
      <Tabs.TabPane tab={<span>
                            <ToolOutlined />
                            Status
                           </span>}
                    key={'status'}
      >
        <Alert.ErrorBoundary>
          <FormViewer CRD={CRD}
                      api={api}
                      CR={CR}
                      show={'status'}
          />
        </Alert.ErrorBoundary>
      </Tabs.TabPane>
    </Tabs>
  )
}
