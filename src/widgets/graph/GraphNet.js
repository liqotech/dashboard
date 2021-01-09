import React, { useEffect, useRef, useState } from 'react';
import Graph from "react-graph-vis";
import './GraphNet.css';
import image from '../../assets/database.png'
import Utils from '../../services/Utils';
import { Badge, Button, Modal, Typography } from 'antd';
import FormViewer from '../form/FormViewer';
import {colorsExtended} from '../../services/Colors';
import { hashCode } from '../../services/stringUtils';

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
  const kinds = useRef([]);

  const utils = new Utils();

  /** Generate the graph layout from a template CR */
  const createNetworkFromTemplate = () => {
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

  const createNetwork = (counter) => {
    const nodes = [];
    const edges = [];

    props.showRef.forEach(key => {
      if(key){
        props.onRef[key].forEach(item => {
          if(!kinds.current.find(kind => kind === item.kind + '_' + item.level)){
            kinds.current.push(item.kind + '_' + item.level);
          }
          if(!nodes.find(node => node.id === item.kind + '_' + item.metadata.name)){
            nodes.push({
              id: item.kind + '_' + item.metadata.name,
              label: '*' + item.kind + '*' + '\n\n' + '_' + item.metadata.name + '_',
              shape: "box",
              group: item.kind + '_' + item.level,
              level: item.level,
              color: colorsExtended[hashCode(item.kind)%44]
            });
            if(item.parent){
              edges.push({
                id: 'edge_' + item.kind + '_' + item.metadata.name + '_' + item.parent,
                from: item.parent,
                to: item.kind + '_' + item.metadata.name,
                dashes: key === 'labelRef'
              })
            }
            counter++;
          }
        });
      }
    })

    const _graph = {
      nodes: nodes,
      edges: edges
    }

    if(!(Utils().arraysEqual(graph.nodes, _graph.nodes) &&
      Utils().arraysEqual(graph.edges, _graph.edges))
    )
      setGraph(_graph)
  }

  useEffect(() => {
    let counter = 0;
    if(network && isClustered) {
      network.setData(graph);
      let clusterOptionsByData;
      kinds.current.forEach(kind => {
        clusterOptionsByData = {
          joinCondition: function(childOptions) {
            return childOptions.group === kind && childOptions.level !== 0;
          },
          clusterNodeProperties: {
            id: 'cluster/' + kind,
            borderWidth: 2,
            label: '*' + kind.split('_')[0] + 's' + '*\n\n_multiple items_',
            shape: "box",
            level: kind.split('_')[1],
            color: colorsExtended[hashCode(kind.split('_')[0])%44]
          }
        };
        network.cluster(clusterOptionsByData);
        counter++;
      })
    }
  }, [graph])

  useEffect(() => {
    //setIsClustered(true);
  }, [props]);

  /** We only want to re-render the network if there is actually a change */
  useEffect(() => {
    if(props.onRef)
      createNetwork(0);
    else
      createNetworkFromTemplate();
  }, [network, isClustered, props.onRef, props.showRef]);

  const events = {
    selectNode: function(event){
      if(!props.onRef){
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
      } else {
        if(event.nodes.length === 1){
          props.selectNode(event.nodes[0]);
        }
        //network.unselectAll();
      }
    },
    doubleClick: function(event){
      if(props.onRef){
        if(event.nodes.length === 1){
          if(network.isCluster(event.nodes[0]) === true){
            network.openCluster(event.nodes[0]);
          } else {
            let node = graph.nodes.find(node => node.id === event.nodes[0]);
            let clusterOptionsByData = {
              joinCondition: function(childOptions) {
                return childOptions.group === node.group && childOptions.level !== 0;
              },
              clusterNodeProperties: {
                id: 'cluster/' + node.group,
                borderWidth: 2,
                label: '*' + node.group.split('_')[0] + 's' + '*\n\n_multiple items_',
                shape: "box",
                level: node.group.split('_')[1],
                color: colorsExtended[hashCode(node.group)%44]
              }
            };
            network.cluster(clusterOptionsByData);
          }
        }
      }
    },
    dragEnd: function(){
      network.unselectAll();
    }
  };

  const options = {
    autoResize: true,
    edges: {
      color: "#222222",
      shadow: true
    },
    physics: {
      enabled: false,
      barnesHut: {
        springConstant: 0.2,
        avoidOverlap: 1
      },
      solver: 'hierarchicalRepulsion'
    },
    layout: {
      /** By default hierarchy is on with clustered nodes on top */
      hierarchical: {
        direction: 'UD',
        nodeSpacing: 200
      }
    },
    nodes: props.onRef ?
      {
        widthConstraint: {
          maximum: 160,
          minimum: 160
        },
        borderWidth: 2,
        shadow: true,
        margin: { top: 10, right: 10, bottom: 30, left: 10 },
        color: {
          border: "#222222"
        },
        font: { multi: "md", color: "#222222"}
      } :
      {
        borderWidth: 4,
        shadow: true,
        size: 30,
        color: {
          border: "#222222",
          background: "#666666"
        },
        font: { color: "#222222" }
      }
  };

  return (
    <div>
      <div className="graph-network">
        <Graph
          style={props.style}
          graph={graph}
          options={options}
          events={events}
          getNetwork={_network => setNetwork(_network)}
        />
      </div>
      {!props.onRef ?
        (
          <Button type={'primary'}
                  disabled={isClustered}
                  onClick={() => setIsClustered(true)}
          >
            {'Cluster ' + props.template.spec.group.cluster + ' nodes'}
          </Button>
        ) : null
      }
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
