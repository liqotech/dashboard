import React, { Component } from 'react';
import Graph from "react-graph-vis";
import './GraphNet.css';
import image from '../../assets/database.png'
import Utils from '../../services/Utils';
import { Button, Modal } from 'antd';
import JsonToTableAntd from '../../editors/JsonToTable/JsonToTableAntd';

class GraphNet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      titleModal: '',
      showModal: false,
      contentModal: null,
      network: null,
      isClustered: true
    };
    this.utils = new Utils();
    this.onClick_clustered = this.onClick_clustered.bind(this);
  }

  onClick_clustered(){
    this.setState({
      isClustered: true
    })
  }

  handleCancel = () => {
    this.setState({
      showModal: false,
    });
  };

  render() {

    const _this = this;
    const nodes = [];
    const edges = [];
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
        enabled: true,
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
    }

    /** If there are no clustered nodes, then do not use hierarchical mode
     *  Maybe later on just give a boolean hierarchical option in the template CRD
     */
    if(!this.props.template.spec.group.cluster){
      delete options.layout.hierarchical;
    }

    /** Create nodes and edges from CR using paths from template CR */
    this.props.custom_resources.forEach(item => {
      let level = 0;

      /** Check if the graph needs to be clustered */
      if(this.props.template.spec.group.cluster){
        /** if there is a clustered type of node, then put them first in the hierarchy */
        if(this.props.template.spec.group.cluster !== this.utils.index(item.spec, this.props.template.spec.group.type))
          level = 1;
      }

      nodes.push({
        id: item.metadata.name,
        label: this.utils.index(item.spec, this.props.template.spec.node),
        shape: "circularImage",
        image: image,
        group: this.utils.index(item.spec, this.props.template.spec.group.type),
        level: level
      });
      if(this.props.template.spec.neighbors){
        let neighbors = this.utils.index(item.spec, this.props.template.spec.neighbors);
        if(neighbors) {
          for(let k in neighbors){
            edges.push({
              from: item.metadata.name,
              to: k
            })
          }
        }
      }
    });

    const graph = {
      nodes: nodes,
      edges: edges
    }

    const events = {
      selectNode: function(event){
        if(event.nodes.length === 1){
          if(_this.state.network.isCluster(event.nodes[0]) === true){
            _this.state.network.openCluster(event.nodes[0]);
            _this.setState({ isClustered: false });
          } else {
            /*console.log('122', _this.props.custom_resources.find(item => {
              return item.metadata.name === event.nodes[0];
            }));*/
            _this.setState({
              titleModal: event.nodes[0],
              showModal: true,
              contentModal: (
                /** Just show the default information */
                <JsonToTableAntd
                  json={ _this.props.custom_resources.find(item => {
                    return item.metadata.name === event.nodes[0];
                  }).spec }
                />
              )
            });
          }
        }
        _this.state.network.unselectAll();
      },
      dragEnd: function(){
        _this.state.network.unselectAll();
      }
    };

    if(this.props.template.spec.group.cluster && this.state.network && this.state.isClustered) {
      this.state.network.setData(graph);
      let clusterOptionsByData = {
        joinCondition: function(childOptions) {
          return childOptions.group === _this.props.template.spec.group.cluster;
        },
        clusterNodeProperties: {
          id: 'cluster/' + _this.props.template.spec.group.cluster,
          borderWidth: 3,
          label: 'cluster/' + _this.props.template.spec.group.cluster,
          shape: "circularImage",
          image: image,
          level: 0
        }
      };
      this.state.network.cluster(clusterOptionsByData);
    }

    return (
      <div>
        <div className="graph-network">
          <Graph
            style={{height: 500}}
            graph={graph}
            options={options}
            events={events}
            getNetwork={network => {
              this.setState({network: network});
            }}
          />
        </div>
        <Button type={'primary'}
                disabled={this.state.isClustered}
                onClick={this.onClick_clustered}
        >
          {'Cluster ' + this.props.template.spec.group.cluster + ' nodes'}
        </Button>
        <Modal style={{paddingLeft: 200}}
               width={'40%'}
               title={this.state.titleModal}
               visible={this.state.showModal}
               onCancel={this.handleCancel}
               footer={null}
        >
          {this.state.contentModal}
        </Modal>
      </div>

    );
  }
}

export default GraphNet;
