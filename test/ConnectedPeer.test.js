import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewMockResponse from '../__mocks__/views.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import FCMockResponseNoIn from '../__mocks__/foreigncluster_noIncoming.json';
import FCMockResponseNoOut from '../__mocks__/foreigncluster_noOutgoing.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import AdvMockResponseRefused from '../__mocks__/advertisement_refused.json';
import AdvMockResponseNotAccepted from '../__mocks__/advertisement_notAccepted.json';
import AdvMockResponseNoStatus from '../__mocks__/advertisement_noStatus.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import Error409 from '../__mocks__/409.json';
import PodsMockResponse from '../__mocks__/pods.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import { metricsPODs } from './RTLUtils';
import { testTimeout } from '../src/constants';
import CMMockResponse from '../__mocks__/configmap_clusterID.json';

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

function mocks(advertisement, foreignCluster, peeringRequest, error, errorMetrics) {
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
    } else if (req.url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: advertisement })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return Promise.resolve(new Response(JSON.stringify({ body: peeringRequest })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return Promise.resolve(new Response(JSON.stringify({ body: ConfigMockResponse })));
    } else if (req.url === 'http://localhost:3001/pod') {
      return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    }  else if (req.url === 'http://localhost:3001/nodes') {
      return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
    } else if (req.url === 'http://localhost:3001/metrics/nodes') {
      if(errorMetrics)
        return Promise.resolve(new Response(JSON.stringify({ items: [] })));
      else
        return Promise.resolve(new Response(JSON.stringify(NodesMetricsMockResponse)));
    } else if (req.url === 'http://localhost:3001/configmaps/liqo') {
      return Promise.resolve(new Response(JSON.stringify({body: CMMockResponse})));
    } else {
      return metricsPODs(req, errorMetrics);
    }
  })
}

async function OKCheck() {
  await setup();

  expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
  expect(await screen.findByText('No peer available at the moment')).toBeInTheDocument();
}

describe('ConnectedPeer', () => {
  test('List of connected peers shows', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 31000));
    })

    expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
  }, 60000)

  test('List of connected peers shows not incoming', async () => {
    mocks(AdvMockResponse, FCMockResponseNoIn, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('List of connected peers shows not outgoing', async () => {
    mocks(AdvMockResponse, FCMockResponseNoOut, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('List of connected peers show if no advertisement', async () => {
    mocks({ items: [] }, FCMockResponse, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('List of connected peers show if no peering request', async () => {
    mocks(AdvMockResponse, FCMockResponse, { items: [] });

    await OKCheck();
  }, testTimeout)

  test('List of connected peers doesn\'t show if no peering request and no advertisement', async () => {
    mocks({ items: [] }, FCMockResponse, { items: [] });

    await setup();

    expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
    expect(await screen.findByText('No peer connected at the moment')).toBeInTheDocument();
  }, testTimeout)

  test('Advertisement is refused', async () => {
    mocks(AdvMockResponseRefused, FCMockResponse, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('Error on pod metrics (404)', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse, false, true);

    await OKCheck();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 31000));
    })

    expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
  }, 60000)

  test('Advertisement status is not accepted', async () => {
    mocks(AdvMockResponseNotAccepted, FCMockResponse, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('Advertisement has no status', async () => {
    mocks(AdvMockResponseNoStatus, FCMockResponse, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('Clicks work', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse, true);

    await OKCheck();

    userEvent.click(screen.getByLabelText('swap'));

    expect(await screen.findByText('Properties')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('swap'));
  }, testTimeout)

  test('Disconnection error show', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse, true);

    await OKCheck();

    userEvent.click(screen.getByLabelText('swap'));

    const disconnect = await screen.findByText('Disconnect');

    userEvent.click(disconnect);

    expect(await screen.findByText(/Could not disconnect/i)).toBeInTheDocument();
    expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
    expect(await screen.findByText('No peer available at the moment')).toBeInTheDocument();
  }, testTimeout)

  test('Dropdown menu don\'t activate collapse', async () => {
    jest.clearAllMocks();

    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    userEvent.click(screen.getByLabelText('dropdown-connected'));
  }, testTimeout)

  test('Disconnection works', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    userEvent.click(screen.getByLabelText('swap'));

    const disconnect = await screen.findByText('Disconnect');

    userEvent.click(disconnect);

    expect(await screen.findByText(/Disconnected from/i)).toBeInTheDocument();

    expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
    expect(await screen.findByText('No peer connected at the moment')).toBeInTheDocument();
  }, testTimeout)
})
