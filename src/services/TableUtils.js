import { Button, Input, Space } from 'antd';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';
import React from 'react';

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

export const getColumnSearchProps = (dataIndex, renderFunc) => ({
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
  render: (text, record) => {
    return renderFunc(text, record, dataIndex);
  },
  title: () => {
    return (
      <div style={{marginLeft: '2em'}}>{dataIndex}</div>
    )
  }
});
