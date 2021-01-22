import { Button, Input, Space, Typography } from 'antd';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';
import React from 'react';
import { Resizable } from 'react-resizable';
import Measure from 'react-measure';

let searchText = '';
let searchedColumn = '';

const handleSearch = (selectedKeys, confirm, dataIndex) => {
  confirm();
  searchText = selectedKeys[0];
  searchedColumn = dataIndex;
};

const handleReset = clearFilters => {
  clearFilters();
  searchText = '' ;
};

export const ResizableTitle = (props) => {
  const { onResize, width, ...restProps } = props;

  restProps.title = '';

  if(!onResize)
    return <th {...restProps} />

  if(!width)
    return (
      <Measure
        bounds
        onResize={contentRect => {
          onResize(null, {}, contentRect.bounds);
        }}
      >
        {({ measureRef }) => (
          <th ref={measureRef} {...restProps} />
        )}
      </Measure>
    )

  return (
    <Resizable
      width={width}
      height={0}
      handleSize={[0, 0]}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const handleResize = (column, setColumns) => (e, { size }, bounds) => {
  if(!size && bounds)
    size = bounds;

  setColumns(prev => {
    let index = prev.indexOf(prev.find(item => item.key === column.key));
    prev[index] = {
      ...prev[index],
      width: size.width
    }
    return [...prev];
  })
};

export const getColumnSearchProps = (dataIndex, renderFunc, setColumns) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
    return (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            searchText = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    )
  },
  filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
  onFilter: (value, record) =>
    record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
  onFilterDropdownVisibleChange: visible => {
    if (visible) {
      setTimeout(() => searchText.select());
    }
  },
  onHeaderCell: setColumns ? (column) => ({
    width: column.width,
    onResize: handleResize(column, setColumns)
  }) : null,
  render: (text, record) => {
    return {
      children: renderFunc(text, record, dataIndex),
      props: {
        title: ''
      }
    }
  }
});
