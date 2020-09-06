import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { metricsPODs, mockCRDAndViewsExtended } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import Error404 from '../__mocks__/404.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import Error409 from '../__mocks__/409.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import PodsMockResponse from '../__mocks__/pods.json';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

let api;

async function setup() {
  api = new ApiManager();
  api.getCRDs().then(async () => {
    render(
      <MemoryRouter>
        <Home api={api} />
      </MemoryRouter>
    )
  });
}

function mocks(){
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      return Promise.resolve(new Response(JSON.stringify({body: FCMockResponse})));
    } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({body: AdvMockResponse})));
    } else if (url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return Promise.resolve(new Response(JSON.stringify({body: PRMockResponse})));
    } else if (url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return Promise.reject(Error404.body);
    } else if (url === 'http://localhost:3001/nodes') {
        return Promise.resolve(new Response(JSON.stringify(NodesMockResponse)));
    } else if (url === 'http://localhost:3001/metrics/nodes') {
        return Promise.resolve(new Response(JSON.stringify({body: NodesMetricsMockResponse})));
    } else if (url === 'http://localhost:3001/pod') {
      return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    } else {
      return metricsPODs({url: url});
    }
  })
}

describe('Home', () => {
  test('Foreign cluster updates', async () => {
    mockCRDAndViewsExtended(null, 'PUT', 'foreignclusters');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    await api.createCustomResource(null, null, null, 'foreignclusters', null, null);
  }, testTimeout)

  test('Advertisement updates', async () => {
    mockCRDAndViewsExtended(null, 'DELETE', 'advertisements');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    await api.deleteCustomResource(null, null, null, 'advertisements', null);
  }, testTimeout)

  test('Peering request updates', async () => {
    mockCRDAndViewsExtended(null, 'DELETE', 'peeringrequests');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    await api.deleteCustomResource(null, null, null, 'peeringrequests', null);
  }, testTimeout)

  test('Cluster config updates', async () => {
    mockCRDAndViewsExtended(null, 'DELETE', 'clusterconfigs');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    await api.updateCustomResource(null, null, null, 'clusterconfigs', null);
  }, testTimeout)

  test('Change CRD on home view', async () => {
    mockCRDAndViewsExtended(null,  null, null, true);
    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    await api.updateCustomResourceDefinition(null, api.getCRDfromKind('Advertisement'));

    expect(await screen.findByText(/modified/i));
  }, testTimeout)

  test('Error on getting CR in home view', async () => {
    mocks();
    await setup();

    expect(await screen.queryByText('LIQO')).not.toBeInTheDocument();
  }, testTimeout)
})
