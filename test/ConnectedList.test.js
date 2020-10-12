import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewMockResponse from '../__mocks__/views.json';
import ApiInterface from '../src/services/api/ApiInterface';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import Error409 from '../__mocks__/409.json';
import PodsMockResponse from '../__mocks__/pods.json';
import { metricsPODs } from './RTLUtils';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import { testTimeout } from '../src/constants';
import CMMockResponse from '../__mocks__/configmap_clusterID.json';
import NamespaceResponse from '../__mocks__/namespaces.json';

fetchMock.enableMocks();

let counter = 0;

async function setup() {
  window.api = ApiInterface({id_token: 'test'});
  window.api.getCRDs().then(async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
  });
}

function mocks(advertisement, foreignCluster, peeringRequest, error, errorPod, errorNodes, addPod, noPods) {
  fetch.mockResponse((req) => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (req.url === 'http://localhost:3001/namespaces') {
      return Promise.resolve(new Response(JSON.stringify({ body: NamespaceResponse })))
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
      if(errorPod)
        return Promise.reject(Error409.body);
      else if(addPod){
        if(counter === 0) {
          counter++;
          return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
        } else {
          let pods = PodsMockResponse;
          let pod = JSON.parse(JSON.stringify(pods.items[3]));
          pod.metadata.name = 'hello-world-deployment-6756549f5-x66v8'
          if(pods.items.length < 5)
            pods.items.push(pod);
          if(noPods)
            return Promise.resolve(new Response(JSON.stringify({body: { items: [] } })));
          else
            return Promise.resolve(new Response(JSON.stringify({body: pods})));
        }
      } else
        return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    } else if (req.url === 'http://localhost:3001/nodes') {
      if(errorNodes)
        return Promise.reject(Error409.body);
      else
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
    } else if (req.url === 'http://localhost:3001/metrics/nodes') {
      return Promise.resolve(new Response(JSON.stringify(NodesMetricsMockResponse)));
    } else if (req.url === 'http://localhost:3001/configmaps/liqo') {
      return Promise.resolve(new Response(JSON.stringify({body: CMMockResponse})));
    } else {
      return metricsPODs(req);
    }
  })
}

async function OKCheck() {
  await setup();

  expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
  expect(await screen.findByText('No peer available at the moment')).toBeInTheDocument();
}

describe('ConnectedList', () => {
  test('Error on getting pod', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse, false, true);

    await OKCheck();
  }, testTimeout);

  test('Pods are refreshed every 30 seconds', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse, false, false, false, true);

    await OKCheck();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 31000));
    })

    userEvent.click(screen.getByLabelText('ellipsis'));

    expect(screen.getByLabelText('snippets')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('snippets'));

    expect(await screen.findByText('General')).toBeInTheDocument();

    let home = await screen.findAllByText('Home');

    userEvent.click(home[1]);

    expect(await screen.findAllByText(/POD/i)).toHaveLength(2);

    expect(await screen.findAllByText(/hello-world/i)).toHaveLength(3);

    counter = 0;

  }, 60000)

  test('Show no metrics when there are no pods', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse, false, false, false, true, true);

    await OKCheck();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 31000));
    })

    expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();

    counter = 0;
  }, 60000)

  test('Disconnection error from dropdown show', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse, true);

    await OKCheck();

    userEvent.click(screen.getByLabelText('ellipsis'));

    expect(screen.getByLabelText('snippets')).toBeInTheDocument();

    const disconnect = await screen.findAllByLabelText('close');

    userEvent.click(disconnect[0]);
    userEvent.click(disconnect[1]);

    expect(await screen.findByText(/Could not disconnect/i)).toBeInTheDocument();
    expect(await screen.findByText('Cluster-Test')).toBeInTheDocument();
  }, testTimeout)
})
