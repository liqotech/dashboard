import { act, render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { alwaysPresentGET, generalHomeGET, loginTest, mockCRDAndViewsExtended, setToken } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import CRDmockResponse from '../__mocks__/crd_fetch_long.json';
import CRDmockEmpty from '../__mocks__/crd_empty.json';
import ViewMockResponse from '../__mocks__/views.json';
import { MemoryRouter } from 'react-router-dom';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import App from '../src/app/App';
import NamespaceResponse from '../__mocks__/namespaces.json';
import NodesMockResponse from '../__mocks__/nodes.json';
import Error404 from '../__mocks__/404.json';
import PodMockResponse from '../__mocks__/pod.json';
import PodsMockResponse from '../__mocks__/pods.json';

fetchMock.enableMocks();

jest.mock('../src/services/api/ApiManager');

async function setup() {
  mockCRDAndViewsExtended();
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  expect(await screen.findByText(/advertisement./i)).toBeInTheDocument();

  expect(screen.getAllByRole('row')).toHaveLength(10);
}

beforeEach(() => {
  Cookies.remove('token');
});

describe('Resource List', () => {
  test('CRD list is correctly paginated and updated when page is changed', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      } else {
        return generalHomeGET(url);
      }
    })

    await loginTest();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    expect(await screen.findByText(/advertisement./i)).toBeInTheDocument();

    expect(screen.getAllByRole('row')).toHaveLength(10);

    userEvent.click(screen.getByText('2'));

    expect(await screen.findAllByRole('row')).toHaveLength(3);

  }, testTimeout)

  test('404 on dashboardconfig', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if (url === 'http://localhost:3001/clustercustomobject/dashboardconfigs') {
        return Promise.reject(Error404.body);
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      } else {
        return generalHomeGET(url);
      }
    })

    await loginTest();

    expect(await screen.queryByText('Custom Resources')).not.toBeInTheDocument();

  }, testTimeout)

  test('CRD list changes on CRD add', async () => {
    await setup();

    expect(await screen.findByText(/advertisement./i));

    let apiManager = window.api.apiManager.current;

    act(() => {
      apiManager.sendAddedSignal('customresourcedefinitions', CRDmockResponse.items[11]);
    })

    await act(async () => {
      apiManager.sendAddedSignal('customresourcedefinitions/', CRDmockResponse.items[11]);
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('SearchDomain')).not.toBeInTheDocument();
  }, testTimeout)

  test('CRD add with same resourceVersion of previous CRD', async () => {
    await setup();

    expect(await screen.findByText(/advertisement./i));

    let apiManager = window.api.apiManager.current;

    act(() => {
      apiManager.sendAddedSignal('customresourcedefinitions', CRDmockResponse.items[0]);
    })

    await act(async () => {
      apiManager.sendAddedSignal('customresourcedefinitions/', CRDmockResponse.items[0]);
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('SearchDomain')).not.toBeInTheDocument();
  }, testTimeout)

  test('CRD watch and View watch return up if unexpectedly aborted', async () => {
    await setup();

    expect(await screen.findByText(/advertisement./i));

    let apiManager = window.api.apiManager.current;

    apiManager.sendAbortedConnectionSignal('customresourcedefinitions/');

    apiManager.sendAbortedConnectionSignal('views/');

    expect(window.api.watches.current).toHaveLength(4);
  }, testTimeout)

  test('CRD list changes on CRD deletion', async () => {
    await setup();

    expect(await screen.findByText(/advertisement./i));

    let apiManager = window.api.apiManager.current;

    act(() => {
      apiManager.sendDeletedSignal('customresourcedefinitions', CRDmockResponse.items[0]);
    })

    await act(async () => {
      apiManager.sendDeletedSignal('customresourcedefinitions/', CRDmockResponse.items[0]);
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('Advertisement')).not.toBeInTheDocument();
  }, testTimeout)

  test('Empty notification when no CRDs', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition' ||
        url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      } else if (url === 'http://localhost:3001/namespaces') {
        return Promise.resolve(new Response(JSON.stringify({ body: NamespaceResponse })))
      } else if (url === 'http://localhost:3001/nodes') {
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
      } else return Promise.reject();
    })

    setToken();
    window.history.pushState({}, 'Page Title', '/apis/apiextensions.k8s.io/v1/customresourcedefinitions');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/No Data/i)).toBeInTheDocument();

    expect(await screen.findByLabelText('insert-row-right')).toBeInTheDocument();

    await act(async () => {
      userEvent.click(screen.getByLabelText('insert-row-right'))
      await new Promise((r) => setTimeout(r, 500));
    })
  }, testTimeout)

  test('Error on namespace get', async () => {

    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition' ||
        url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
      } else if (url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1' ||
        url === 'http://localhost/apiserver/apis/apiextensions.k8s.io/v1') {
        return Promise.reject(401)
      }else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      } else if (url === 'http://localhost:3001/namespaces') {
        return Promise.resolve(new Response(JSON.stringify({ body: NamespaceResponse })))
      } else if (url === 'http://localhost:3001/nodes') {
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
      } else return Promise.reject();
    })

    setToken();
    window.history.pushState({}, 'Page Title', '/apis/apiextensions.k8s.io/v1/customresourcedefinitions');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/No Data/i)).toBeInTheDocument();
  }, testTimeout)

  test('APIv1 redirect works', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition' ||
        url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
      } else if (url === 'http://localhost:/apiserver/api/v1/pods/hello-world-deployment-6756549f5-x66v9' ||
        url === 'http://localhost/apiserver/api/v1/pods/hello-world-deployment-6756549f5-x66v9'
      ) {
        return Promise.resolve(new Response(JSON.stringify(PodMockResponse)))
      }else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      } else if (url === 'http://localhost:3001/namespaces') {
        return Promise.resolve(new Response(JSON.stringify({ body: NamespaceResponse })))
      } else if (url === 'http://localhost:3001/nodes') {
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
      } else return Promise.reject();
    })

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods/hello-world-deployment-6756549f5-x66v9');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/pod/i));
  }, testTimeout)

  test('Apis resource with namespace redirect works', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition' ||
        url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
      } else if (url === 'http://localhost:/apiserver/apis/apps/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9' ||
        url === 'http://localhost/apiserver/apis/apps/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9'
      ) {
        return Promise.resolve(new Response(JSON.stringify(PodMockResponse)))
      }else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      } else if (url === 'http://localhost:3001/namespaces') {
        return Promise.resolve(new Response(JSON.stringify({ body: NamespaceResponse })))
      } else if (url === 'http://localhost:3001/nodes') {
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
      } else return Promise.reject();
    })

    setToken();
    window.history.pushState({}, 'Page Title', '/apis/apps/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/pod/i));
  }, testTimeout)

  test('Apis list with namespace redirect works', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition' ||
        url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
      } else if (url === 'http://localhost:/apiserver/apis/apps/v1/namespaces/test/pods/' ||
        url === 'http://localhost/apiserver/apis/apps/v1/namespaces/test/pods/'
      ) {
        return Promise.resolve(new Response(JSON.stringify(PodsMockResponse)))
      }else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      } else if (url === 'http://localhost:3001/namespaces') {
        return Promise.reject(new Response(JSON.stringify({ body: NamespaceResponse })))
      } else if (url === 'http://localhost:3001/nodes') {
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
      } else return Promise.reject();
    })

    setToken();
    window.history.pushState({}, 'Page Title', '/apis/apps/v1/namespaces/test/pods/');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/pod/i));
  }, testTimeout)
})
