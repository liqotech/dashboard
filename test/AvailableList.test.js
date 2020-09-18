import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewMockResponse from '../__mocks__/views.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import FCMockResponse from '../__mocks__/foreigncluster_noJoin.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import SDMockResponse from '../__mocks__/searchdomain.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import Error409 from '../__mocks__/409.json';
import PodsMockResponse from '../__mocks__/pods.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import CMMockResponse from '../__mocks__/configmap_clusterID.json';

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
    } else if (req.url === 'http://localhost:3001/configmaps/liqo') {
      return Promise.resolve(new Response(JSON.stringify({body: CMMockResponse})));
    }
  })
}

async function OKCheck() {
  await setup();

  expect(await screen.findByText('8d73c01a-f23a-45dc-822b-7d3232683f53')).toBeInTheDocument();
  expect(await screen.findByText('No peer connected at the moment')).toBeInTheDocument();
}

describe('AvailableList', () => {

  test('Close the modal', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    userEvent.click(screen.getByLabelText('plus'));

    let close = await screen.findAllByLabelText('close');

    userEvent.click(close[1]);

    setTimeout(() => {
      expect(screen.queryByText(/add domain/i)).not.toBeInTheDocument();
    }, 1500);

    userEvent.click(screen.getByLabelText('plus'));

  }, 60000)

})
