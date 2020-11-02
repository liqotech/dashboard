import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { alwaysPresentGET, metricsPODs, setToken } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import Error404 from '../__mocks__/404.json';
import Error401 from '../__mocks__/401.json';
import App from '../src/app/App';
import ViewMockResponse from '../__mocks__/views.json';
import { testTimeout } from '../src/constants';
import PodsMockResponse from '../__mocks__/pods.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import CMMockResponse from '../__mocks__/configmap_clusterID.json';
import Cookies from 'js-cookie';
import userEvent from '@testing-library/user-event';
import NamespaceResponse from '../__mocks__/namespaces.json';
import ApiV1MockResponse from '../__mocks__/apiv1.json';
import ApisMockResponse from '../__mocks__/apis.json';
import AppsResponse from '../__mocks__/apps.json';
import APIGroupList from '../src/resources/APIGroup/APIGroupList';
import ApiInterface from '../src/services/api/ApiInterface';
import APIResourceList from '../src/resources/APIResourceList/APIResourceList';

fetchMock.enableMocks();

beforeEach(() => {
  Cookies.remove('token');
});

function mocks(errorApis, errorApi){
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/namespaces') {
      return Promise.resolve(new Response(JSON.stringify({ body: NamespaceResponse })))
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
    } else if (url === 'http://localhost:3001/namespaces') {
      return Promise.resolve(new Response(JSON.stringify({ body: NamespaceResponse })))
    } else if (url === 'http://localhost/apiserver/api/v1' || url === 'http://localhost:/apiserver/api/v1') {
      if(errorApi)
        return Promise.reject(Error401.body);
      else
        return Promise.resolve(new Response(JSON.stringify(ApiV1MockResponse)));
    } else if (url === 'http://localhost:3001/apis/') {
      if(errorApis) {
        return Promise.reject(Error401.body);
      }
      else
        return Promise.resolve(new Response(JSON.stringify({body: ApisMockResponse})));
    } else if (url === 'http://localhost/apiserver/apis/apps/v1' || url === 'http://localhost:/apiserver/apis/apps/v1') {
      return Promise.resolve(new Response(JSON.stringify(AppsResponse)));
    } else if (url === 'http://localhost:3001/pod') {
      return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    } else if(alwaysPresentGET(url)){
      return alwaysPresentGET(url)
    } else {
      return metricsPODs({url : url});
    }
  })
}

describe('APIGroupList', () => {
  test('General api views', async () => {
    mocks();

    setToken();

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Api v1/i)).toBeInTheDocument();
    expect(await screen.findByText('Apis')).toBeInTheDocument();

    userEvent.click(await screen.findByText('Apis'));
    expect(await screen.findByText('apps')).toBeInTheDocument();
    userEvent.click(await screen.findByText('apps'));
    expect(await screen.findByText('deployments')).toBeInTheDocument();
    userEvent.click(await screen.findByText('apis'));
    userEvent.click(await screen.findByLabelText('home'));

    userEvent.click(await screen.findByText(/Api v1/i));
    expect(await screen.findByText('pods')).toBeInTheDocument();
    userEvent.click(await screen.findByText('pods'));
    expect(await screen.findByText('Pod')).toBeInTheDocument();
    userEvent.click(await screen.findByText('api'));
    expect(await screen.findByText('pods')).toBeInTheDocument();
    userEvent.click(await screen.findByText('pods'));
    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();
    userEvent.click(await screen.findByText('hello-world-deployment-6756549f5-x66v9'));
    expect(await screen.findAllByText('General')).toHaveLength(2);
    userEvent.click(await screen.findByText('Metadata'));
    userEvent.click(await screen.findByText('Spec'));
    userEvent.click(await screen.findByText('Status'));
    userEvent.click(await screen.findByText('Logs'));
    expect(await screen.findByLabelText('log-editor')).toBeInTheDocument();

    userEvent.click(await screen.findByText('pods'));
    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();

  }, testTimeout)

  test('Error api views', async () => {
    mocks(true);

    setToken();

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('401')).toBeInTheDocument();

  }, testTimeout)

  test('Error apis views', async () => {
    mocks(undefined, true);

    setToken();

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('401')).toBeInTheDocument();

  }, testTimeout)

  test('Error apis loading list', async () => {
    mocks(true);

    setToken();

    window.api = ApiInterface({id_token: 'test'});

    render(
      <MemoryRouter>
        <APIGroupList />
      </MemoryRouter>
    );

  }, testTimeout)

  test('Error api loading list', async () => {
    mocks(undefined, true);

    setToken();

    window.api = ApiInterface({id_token: 'test'});

    render(
      <MemoryRouter>
        <APIResourceList />
      </MemoryRouter>
    );

  }, testTimeout)
})
