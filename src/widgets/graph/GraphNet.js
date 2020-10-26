import React, { useEffect, useState } from 'react';
import Graph from "react-graph-vis";
import './GraphNet.css';
import image from '../../assets/database.png'
import Utils from '../../services/Utils';
import { Badge, Button, Modal } from 'antd';
import FormViewer from '../form/FormViewer';

function GraphNet(props){

  const [titleModal, setTitleModal] = useState(<Badge />);
  const [showModal, setShowModal] = useState(false);
  const [contentModal, setContentModal] = useState(<div/>);
  const [isClustered, setIsClustered] = useState(true);
  const [graph, setGraph] = useState({
    nodes: [],
    edges: []
  });
  const [network, setNetwork] = useState(null);

  const utils = new Utils();

  /** Generate the graph layout */
  const createNetwork = () => {
    const nodes = [];
    const edges = [];

    /** If there are no clustered nodes, then do not use hierarchical mode
     *  Maybe later on just give a boolean hierarchical option in the template CRD
     */
    if (!props.template.spec.group.cluster) {
      delete options.layout.hierarchical;
    }

    /** Create nodes and edges from CR using paths from template CR */
    props.customResources.forEach(item => {
      let level = 0;

      /** Check if the graph needs to be clustered */
      if (props.template.spec.group.cluster) {
        /** if there is a clustered type of node, then put them first in the hierarchy */
        if (props.template.spec.group.cluster !== utils.index(item.spec, props.template.spec.group.type))
          level = 1;
      }

      nodes.push({
        id: item.metadata.name,
        label: utils.index(item.spec, props.template.spec.node),
        shape: "circularImage",
        image: image,
        group: utils.index(item.spec, props.template.spec.group.type),
        level: level
      });
      if (props.template.spec.neighbors) {
        let neighbors = utils.index(item.spec, props.template.spec.neighbors);
        if (neighbors) {
          for (let k in neighbors) {
            edges.push({
              from: item.metadata.name,
              to: k
            })
          }
        }
      }
    });

    const _graph = {
      nodes: nodes,
      edges: edges
    }

    if(props.template.spec.group.cluster && network && isClustered) {
      network.setData(_graph);
      let clusterOptionsByData = {
        joinCondition: function(childOptions) {
          return childOptions.group === props.template.spec.group.cluster;
        },
        clusterNodeProperties: {
          id: 'cluster/' + props.template.spec.group.cluster,
          borderWidth: 3,
          label: 'cluster/' + props.template.spec.group.cluster,
          shape: "circularImage",
          image: image,
          level: 0
        }
      };
      network.cluster(clusterOptionsByData);
    }

    setGraph(_graph);

    if(network)
      network.fit({
        animation: true
      });
  }

  useEffect(() => {
    setIsClustered(true);
  }, [props]);

  /** We only want to re-render the network if there is actually a change */
  useEffect(() => {
    createNetwork();
  }, [network, isClustered]);

  const events = {
    selectNode: function(event){
      if(event.nodes.length === 1){
        /** If it's a cluster, open it on click */
        if(network.isCluster(event.nodes[0]) === true){
          network.openCluster(event.nodes[0]);
          setIsClustered(() => {
            return false;
          });
        } else {
          setTitleModal(<Badge status="processing" text={event.nodes[0]} />);
          setShowModal(true);
          let resource = props.customResources.find(item => {
            return item.metadata.name === event.nodes[0];
          });
          setContentModal(
            /** Just show the default information */
            <FormViewer CRD={props.CRD} show={'spec'}
                        resource={resource}
                        resourceName={resource.metadata.name}
                        resourceNamespace={resource.metadata.namespace}
            />
          );
        }
      }
      network.unselectAll();
    },
    dragEnd: function(){
      network.unselectAll();
    }
  };

  const options = {
    autoResize: true,
    nodes: {
      borderWidth: 4,
      shadow: true,
      size: 30,
      color: {
        border: "#222222",
        background: "#666666"
      },
      font: { color: "#222222" }
    },
    edges: {
      color: "#222222",
      shadow: true
    },
    physics: {
      enabled: false,
      barnesHut: {
        springConstant: 0.2,
        avoidOverlap: 0.5
      }
    },
    layout: {
      /** By default hierarchy is on with clustered nodes on top */
      hierarchical: {
        direction: 'UD'
      }
    }
  };

  return (
    <div>
      <div className="graph-network">
        <Graph
          style={{height: '50vh'}}
          graph={graph}
          options={options}
          events={events}
          getNetwork={_network => setNetwork(_network)}
        />
      </div>
      <Button type={'primary'}
              disabled={isClustered}
              onClick={() => setIsClustered(true)}
      >
        {'Cluster ' + props.template.spec.group.cluster + ' nodes'}
      </Button>
      <Modal style={{paddingLeft: 200}}
             destroyOnClose
             width={'60%'}
             title={titleModal}
             visible={showModal}
             onCancel={() => setShowModal(false)}
             footer={null}
      >
        {contentModal}
      </Modal>
    </div>
  );
}

export default GraphNet;
