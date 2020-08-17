import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.mock('./src/services/ApiManager');
jest.mock('./src/services/Authenticator');

jest.mock('react-ace', () => {
  return ({ onChange }) => {
    return <input aria-label={'editor'} onChange={e => onChange(e.target.value)}/>
  };
});

jest.mock('ace-builds/src-noconflict/mode-json', () => { return null});
jest.mock('ace-builds/src-noconflict/mode-yaml', () => { return null});
jest.mock('ace-builds/src-noconflict/theme-monokai', () => { return null});
jest.mock('ace-builds/src-noconflict/theme-github', () => { return null});

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

jest.mock('react-graph-vis', () => {
  return ({ graph }) => {
    let nodesTot = [];
    graph.nodes.forEach(node => {
      nodesTot.push(
        <button key={node.id}>{node.id}</button>
      )
    })
    return (
      <div aria-label={'graph_mock'}>
        {nodesTot}
      </div>
    )
  };
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
