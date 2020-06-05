import * as React from "react";

import "./JsonToTable.css";
import JSONToTableUtils from "./JsonToTableUtils";
import UpCircleOutlined from '@ant-design/icons/lib/icons/UpCircleOutlined';

export default class JsonToTableAntd extends React.Component{
  // constructor
  constructor(props, context) {
    super(props, context);
    this.state = {
      json: this.props.json,
      jsonShown: JSON.parse(JSON.stringify(this.props.json))
    }
    this.JSONToTableUtils = new JSONToTableUtils();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(JSON.stringify(prevState.json) !== JSON.stringify(this.props.json)){
      this.state.json = this.props.json;
      this.state.jsonShown = this.props.json;
      /** using forceUpdate is a bit of a workaround as it should be avoided,
       *  but setState throws an error, and as long as it works...
       */
      this.forceUpdate();
    }
  }

  render() {
    return (
      <div className={'json-to-table'}>
        <table key={`__j2t_root_table`}>
          <tbody key={`__j2t_root_tbody`}>{this.renderObject(this.state.jsonShown, undefined, 0)}</tbody>
        </table>
      </div>
    );
  }

  renderObject = (obj, header, idx) => {
    const phrase = [];
    let tmp;
    if (header) {
      phrase.push(this.renderRowHeader(header));
    }

    const objType = this.JSONToTableUtils.getObjectType(obj);

    switch (objType) {
      case 'ObjectWithNonNumericKeys':
        tmp = header ? (
          <table key={`__j2t_tableObj${idx}`}>
            <tbody
              key={`__j2t_bObj${idx}`}
            >
            {this.renderRows(obj)}
            </tbody>
          </table>
        ) : (
          this.renderRows(obj)
        );
        break;
      case 'Array':
        tmp = header ? (
          <table key={`__j2t_tableArr${idx}`}>
            <tbody key={`__j2t_bArr${idx}`}>
            {this.parseArray(obj)}
            </tbody>
          </table>
        ) : (
          this.parseArray(obj)
        );
        break;
    }
    phrase.push(tmp);
    const retval = phrase.map(p => p);
    return header ? (
      <tr key={`__j2t_trObj${idx}${Math.random()}`}>{this.renderCell({content: retval, colspan: 2})}</tr>
    ) : (
      retval
    );
  };

  renderCell = (params) => {
    const {content, colspan, isHeader} = params;
    const valueDisplay = isHeader ? <strong>{content}</strong> : content;
    return <td colSpan={colspan ? colspan : 0} key={`__j2t_trObj${valueDisplay}${Math.random()}`}>{valueDisplay}</td>;
  };

  renderHeader = (labels) => {
    return (
      <tr key={`__j2t_trHeader`}>
        {labels.map((v) => {
          return this.renderCell({content: v});
        })}
      </tr>
    );
  };

  renderValues = (values) => {
    return (
      <tr key={`__j2t_trArrString`}>
        {values.map(k => {
          return this.renderCell({content: k});
        })}
      </tr>
    );
  };

  renderRowValues = (anArray, labels) => {
    return anArray.map((item, idx) => {

      return (
        <tr key={`__j2t_Arr${idx.toString()}`}>
          {labels.map(k => {
            const isValuePrimitive =
              this.JSONToTableUtils.getObjectType(item[k]) === 'Primitive' ||
              this.JSONToTableUtils.getObjectType(item[k]) === 'Array';
            return isValuePrimitive
              ? this.renderCell({content: item[k]})
              : (<td key={'td_' + item[k] + Math.random()}>
                <table key={'td_' + item[k] + Math.random()}>
                  <tbody key={'td_' + item[k] + Math.random()}>{this.renderObject(item[k], '', idx)}</tbody>
                </table></td>)
          })}
        </tr>
      );
    });
  };

  parseArray = (anArray) => {
    const phrase = [];
    const labels = this.JSONToTableUtils.getUniqueObjectKeys(anArray);
    if (this.JSONToTableUtils.checkLabelTypes(labels.labels) !== "number") {
      phrase.push(this.renderHeader(labels.labels));
      phrase.push(this.renderRowValues(anArray, labels.labels));
    } else {
      phrase.push(this.renderValues(anArray));
    }
    return phrase;
  };

  renderRow = (k, v, idx) => {
    return (
      <tr key={`__j2t_tr${idx}`}>
        <td key={`__j2t_tdk${idx}`}>
          <strong>{k}</strong>
        </td>
        <td key={`__j2t_tdv${idx}`}>{v}</td>
      </tr>
    );
  };

  /**
   * @WARNING!!
   * This could generate some problem as that it suppose the are no keys
   * with the same name in the object (which there could actually be)
   * @param label: the key that we want to show/hide in the object
   *
   * @TODO find a good solution
   */
  onClick(label){
    let json = this.state.jsonShown;
    if(Object.keys(this.JSONToTableUtils.findVal(json, label).value).length === 0){
      json = this.JSONToTableUtils.findVal(json, label, this.JSONToTableUtils.findVal(this.state.json, label).value).object;
    } else {
      json = this.JSONToTableUtils.findVal(json, label, {}).object;
    }
    this.setState({jsonShown: json});
  }

  renderRowHeader = (label) => {
    return (
      <div key={`__j2t_rw${label}`}>
        <UpCircleOutlined style={{marginRight: 10}}
                          onClick={()=>{this.onClick(label)}}/>
        <strong onClick={()=>{this.onClick(label)}}>{label}</strong>
      </div>
    );
  };

  renderRows = (obj, labelKey) => {
    return Object.keys(obj).map((k, idx) => {
      const value = obj[k];
      const isValuePrimitive = this.JSONToTableUtils.getObjectType(value) === 'Primitive';
      // render row when value is primitive otherwise inspect the value and make the key as header
      const retval = isValuePrimitive
        ? this.renderRow(k, value, idx)
        : this.renderObject(value, k, idx);
      return retval;
    });
  };
}
