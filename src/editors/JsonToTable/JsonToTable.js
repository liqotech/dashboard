import * as React from "react";

import "./JsonToTable.css";
import JSONToTableUtils from "./JsonToTableUtils";

export default class JsonToTable extends React.Component{
  // constructor
  constructor(props, context) {
    super(props, context);
    this.JSONToTableUtils = new JSONToTableUtils();
  }

  render() {
    return (
      <div className={'json-to-table'}>
        <table key={`__j2t_root_table`}>
          <tbody key={`__j2t_root_tbody`}>{this.renderObject(this.props.json, undefined, 0)}</tbody>
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
      <tr key={`__j2t_trObj${idx}`}>{this.renderCell({content: retval, colspan: 2})}</tr>
    ) : (
      retval
    );
  };

  renderCell = (params) => {
    const {content, colspan, isHeader} = params;
    const valueDisplay = isHeader ? <strong>{content}</strong> : content;
    return <td colSpan={colspan ? colspan : 0} key={`__j2t_trObj${valueDisplay}`}>{valueDisplay}</td>;
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
              this.JSONToTableUtils.getObjectType(item[k]) === 'Primitive';
            return isValuePrimitive
              ? this.renderCell({content: item[k]})
              : this.renderObject(item[k], '', idx);
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

  renderRowHeader = (label) => {
    return (
      <div key={`__j2t_rw${label}`}>
        <strong>{label}</strong>
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
