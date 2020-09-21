import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { metricsPODs } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import Error404 from '../__mocks__/404.json';
import App from '../src/app/App';
import ViewMockResponse from '../__mocks__/views.json';
import { testTimeout } from '../src/constants';
import PodsMockResponse from '../__mocks__/pods.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import CMMockResponse from '../__mocks__/configmap_clusterID.json';

fetchMock.enableMocks();

async function setup() {
  window.OIDC_PROVIDER_URL = 'test-url';
  window.OIDC_CLIENT_ID = 'test-id';

  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
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
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
    } else if (url === 'http://localhost:3001/pod') {
      return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    } else if (url === 'http://localhost:3001/nodes') {
      return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
    } else if (url === 'http://localhost:3001/metrics/nodes') {
      return Promise.resolve(new Response(JSON.stringify(NodesMetricsMockResponse)));
    } else if (url === 'http://localhost:3001/configmaps/liqo') {
      return Promise.resolve(new Response(JSON.stringify({body: CMMockResponse})));
    } else {
      return metricsPODs({url : url});
    }
  })
}

describe('App', () => {
  test('OIDC', async () => {
    mocks();

    await setup();

    /** Assert that a success notification has spawned */
    expect(await screen.findByText(/custom resources/i)).toBeInTheDocument();
  }, testTimeout)
})
