import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewMockResponse from '../__mocks__/views.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import FCMockResponseNoJoin from '../__mocks__/foreigncluster_noJoin.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import SDMockResponse from '../__mocks__/searchdomain.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import Error409 from '../__mocks__/409.json';
import PodsMockResponse from '../__mocks__/pods.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import { metricsPODs } from './RTLUtils';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

async function setup() {
  window.api = new ApiManager({id_token: 'test'});
  window.api.getCRDs().then(async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
  });
}

function mocks(advertisement, foreignCluster, peeringRequest, error) {
  fetch.mockResponse((req) => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      if(req.method === 'GET')
        return Promise.resolve(new Response(JSON.stringify({ body: foreignCluster })));
      else{
        if(!error){
          foreignCluster = foreignCluster.items[0];
          foreignCluster.metadata.resourceVersion++;
          foreignCluster.spec.join = false;
          return Promise.resolve(new Response(JSON.stringify({ body: foreignCluster })));
        } else {
          return Promise.reject(Error409.body);
        }
      }
    } else if (req.url === 'http://localhost:3001/clustercustomobject/searchdomains') {
      if(req.method === 'GET')
        return Promise.resolve(new Response(JSON.stringify({ body: SDMockResponse })));
      else{
        if(!error){
          let searchDomain = SDMockResponse.items[0];
          searchDomain.metadata.resourceVersion++;
          return Promise.resolve(new Response(JSON.stringify({ body: searchDomain })));
        } else {
          return Promise.reject(Error409.body);
        }
      }
    } else if (req.url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: advertisement })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return Promise.resolve(new Response(JSON.stringify({ body: peeringRequest })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return Promise.resolve(new Response(JSON.stringify({ body: ConfigMockResponse })));
    } else if (req.url === 'http://localhost:3001/pod') {
      return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    } else if (req.url === 'http://localhost:3001/nodes') {
      return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
    } else if (req.url === 'http://localhost:3001/metrics/nodes') {
      return Promise.resolve(new Response(JSON.stringify(NodesMetricsMockResponse)));
    } else {
      return metricsPODs(req);
    }
  })
}

async function OKCheckAvailable() {
  await setup();

  expect(await screen.findByText('8d73c01a-f23a-45dc-822b-7d3232683f53')).toBeInTheDocument();
  expect(await screen.findByText('No peer connected at the moment')).toBeInTheDocument();
}

async function OKCheckConnected() {
  await setup();

  expect(await screen.findByText('8d73c01a-f23a-45dc-822b-7d3232683f53')).toBeInTheDocument();
  expect(await screen.findByText('No peer available at the moment')).toBeInTheDocument();
}

describe('PeerProperties', () => {
  test('Available Peer show properties', async () => {
    mocks(AdvMockResponse, FCMockResponseNoJoin, PRMockResponse);

    await OKCheckAvailable();

    userEvent.click(screen.getByText('8d73c01a-f23a-45dc-822b-7d3232683f53'));
    userEvent.click(await screen.findByText('Properties'));

    expect(await screen.findByText('Foreign Cluster')).toBeInTheDocument();
    expect(screen.getByText('Spec')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

  }, testTimeout)

  test('Available Peer show properties from dropdown', async () => {
    mocks(AdvMockResponse, FCMockResponseNoJoin, PRMockResponse);

    await OKCheckAvailable();

    expect(await screen.queryByText('Foreign Cluster')).not.toBeInTheDocument();

    userEvent.click(screen.getByLabelText('ellipsis'));
    userEvent.click(await screen.findByLabelText('tool'));

    expect(await screen.findByText('Foreign Cluster')).toBeInTheDocument();
    expect(screen.getByText('Spec')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

  }, testTimeout)

  test('Connected Peer show properties', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheckConnected();

    expect(await screen.queryByText('Foreign Cluster')).not.toBeInTheDocument();

    userEvent.click(screen.getByText('8d73c01a-f23a-45dc-822b-7d3232683f53'));
    userEvent.click(await screen.findByText('Properties'));

    expect(await screen.findByText('Foreign Cluster')).toBeInTheDocument();
    expect(screen.getByText('Spec')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

  }, testTimeout)

  test('Connected Peer show properties from dropdown', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheckConnected();

    expect(await screen.queryByText('Foreign Cluster')).not.toBeInTheDocument();

    userEvent.click(screen.getByLabelText('ellipsis'));
    userEvent.click(await screen.findByLabelText('tool'));

    expect(await screen.findByText('Foreign Cluster')).toBeInTheDocument();
    expect(screen.getByText('Spec')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    let close = await screen.findAllByLabelText('close');

    userEvent.click(close[2]);

    setTimeout(() => {
      expect(screen.queryByText('Foreign Cluster')).not.toBeInTheDocument();
    }, 1500);

    userEvent.click(await screen.findByLabelText('plus'));

  }, 60000)

})
