import { Modal, Tabs, Alert } from 'antd';
import React from 'react';
import FormViewer from '../widgets/form/FormViewer';
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
          {createTabs('ForeignCluster', props.foreignCluster)}
        </Tabs.TabPane>
        { client ? (
          <Tabs.TabPane tab={'Advertisement'} key={2}>
            {createTabs('Advertisement', props.advertisements.find(adv =>
              {return adv.metadata.name === props.foreignCluster.status.outgoing.advertisement.name}
            ))}
          </Tabs.TabPane>
        ) : null }
        { server ? (
          <Tabs.TabPane tab={'Peering Request'} key={4}>
            {createTabs('PeeringRequest', props.peeringRequests.find(pr =>
              {return pr.metadata.name === props.foreignCluster.status.incoming.peeringRequest.name}
            ))}
          </Tabs.TabPane>
        ) : null }
      </Tabs>
    </Modal>
  )
}

function createTabs(kind, CR) {
  let CRD = window.api.getCRDFromKind(kind);

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
                      resource={CR}
                      show={'metadata'}
                      resourceName={CR.metadata.name}
                      resourceNamespace={CR.metadata.namespace}
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
                      resource={CR}
                      show={'spec'}
                      resourceName={CR.metadata.name}
                      resourceNamespace={CR.metadata.namespace}
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
                      resource={CR}
                      show={'status'}
                      resourceName={CR.metadata.name}
                      resourceNamespace={CR.metadata.namespace}
          />
        </Alert.ErrorBoundary>
      </Tabs.TabPane>
    </Tabs>
  )
}
