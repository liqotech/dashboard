import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.mock('./src/services/api/ApiManager');
jest.mock('./src/services/api/Authenticator');
jest.mock('./src/templates/graph/GraphNet', () => {
  return function GraphNet() {
    return (<div/>);
  }
});

jest.mock('./src/services/TimeUtils', () => {
  function calculateAge() {
    return '1d';
  }
  return {
    calculateAge
  };
});

jest.mock('./src/resources/common/CustomIcon', () => {
  const icons = require(`@ant-design/icons`);

  const Icon = ({type}) => {
    const Component = icons[type];
    return <Component />;
  }

  return function CustomIcon(props) {
    return (<Icon type={props.icon ? props.icon : 'ApiOutlined'}/>)
  }
})

jest.mock('react-ace', () => {
  return ({ onChange }) => {
    return <input aria-label={'editor'} onChange={e => onChange(e.target.value)}/>
  };
});

jest.mock('ace-builds/src-noconflict/mode-json', () => { return null});
jest.mock('ace-builds/src-noconflict/mode-yaml', () => { return null});
jest.mock('ace-builds/src-noconflict/theme-monokai', () => { return null});
jest.mock('ace-builds/src-noconflict/theme-github', () => { return null});
jest.mock('ace-builds/webpack-resolver', () => { return null});
jest.mock('ace-builds/src-noconflict/mode-markdown', () => { return null});
jest.mock('ace-builds/src-noconflict/mode-javascript', () => { return null});
jest.mock('ace-builds/src-noconflict/theme-dawn', () => { return null});

jest.mock('./src/views/CustomViewUtils', () => {
  const onDrag = () => {}
  const onResize = () => {}
  const resizeDetector = () => {}

  return {
    onDrag,
    onResize,
    resizeDetector
  }
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})
