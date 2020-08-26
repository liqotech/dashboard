import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewMockResponse from '../__mocks__/views.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import Error409 from '../__mocks__/409.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import PodsMockResponse from '../__mocks__/pods.json';
import LineChart from '../src/templates/line/LineChart';
import { metricsPODs } from './RTLUtils';

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

function mocks(advertisement, foreignCluster, peeringRequest, error, errorMetrics) {
  fetch.mockResponse((req) => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      return Promise.resolve(new Response(JSON.stringify({ body: foreignCluster })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: advertisement })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return Promise.resolve(new Response(JSON.stringify({ body: peeringRequest })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return Promise.resolve(new Response(JSON.stringify({ body: ConfigMockResponse })));
    } else if (req.url === 'http://localhost:3001/nodes') {
      if(!error)
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
      else
        return Promise.reject({ body: Error409 });
    } else if (req.url === 'http://localhost:3001/metrics/nodes') {
      if(!errorMetrics)
        return Promise.resolve(new Response(JSON.stringify(NodesMetricsMockResponse)));
      else
        return Promise.reject(409);
    } else if (req.url === 'http://localhost:3001/pod') {
      return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    } else {
      return metricsPODs(req);
    }
  })
}

async function OKCheck() {
  await setup();

  expect(await screen.findByText('8d73c01a-f23a-45dc-822b-7d3232683f53')).toBeInTheDocument();
  expect(await screen.findByText('No peer available at the moment')).toBeInTheDocument();
  expect(await screen.findByText('Home')).toBeInTheDocument();
  expect(await screen.findByText(/Foreign/i)).toBeInTheDocument();

  expect(await screen.findAllByText('Consumption')).toHaveLength(2);
  expect(await screen.findAllByText('Consumption trend')).toHaveLength(2);
}

describe('Status', () => {
  test('General status information and update', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    await new Promise((r) => setTimeout(r, 31000));
  }, 40000)

  test('Line chart NaN data', async () => {
    render(
      <MemoryRouter>
        <LineChart data={[{"resource": "CPU", "date": "00:00:00", "value": NaN },
          {"resource": "RAM", "date": "00:00:00", "value": NaN }]} />
      </MemoryRouter>
    )
  })
})
