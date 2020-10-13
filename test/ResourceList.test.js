import { act, render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { alwaysPresentGET, generalHomeGET, loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import CRDmockResponse from '../__mocks__/crd_fetch_long.json';
import CRDmockEmpty from '../__mocks__/crd_empty.json';
import ViewMockResponse from '../__mocks__/views.json';
import ApiInterface from '../src/services/api/ApiInterface';
import { MemoryRouter } from 'react-router-dom';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import ResourceList from '../src/resources/resourceList/ResourceList';
import App from '../src/app/App';
import NamespaceResponse from '../__mocks__/namespaces.json';
import NodesMockResponse from '../__mocks__/nodes.json';

fetchMock.enableMocks();

jest.mock('../src/services/api/ApiManager');

async function setup() {
  mockCRDAndViewsExtended();
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  expect(await screen.findByText(/advertisement/i)).toBeInTheDocument();

  expect(screen.getAllByRole('row')).toHaveLength(10);
}

beforeEach(() => {
  Cookies.remove('token');
});

describe('Resource List', () => {
  /*test('Sidebar updates when a resource is added/removed to favourites', async () => {
    await setup();

    expect(await screen.findByLabelText('caret-down'));

    const favCRD = screen.getAllByLabelText('star')[2];
    userEvent.click(favCRD);

    userEvent.click(await screen.findByLabelText('caret-down'));

    expect(await screen.findAllByText('Advertisement')).toHaveLength(2);

    userEvent.click(favCRD);

    expect(screen.findByText('Advertisement'));
  }, testTimeout)*/

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

    expect(await screen.findByText(/advertisement/i)).toBeInTheDocument();

    expect(screen.getAllByRole('row')).toHaveLength(10);

    userEvent.click(screen.getByText('2'));

    expect(await screen.findAllByRole('row')).toHaveLength(2);

  }, testTimeout)

  test('CRD list changes on CRD deletion', async () => {
    await setup();

    expect(await screen.findByText(/advertisement/i));

    let apiManager = window.api.apiManager.current;

    act(() => {
      apiManager.sendDeletedSignal('customresourcedefinitions', CRDmockResponse.items[0]);
    })

    expect(await screen.queryByText('Advertisement')).not.toBeInTheDocument();
  }, testTimeout)

  test('CRD list changes on CRD add', async () => {
    await setup();

    expect(await screen.findByText(/advertisement/i));

    let apiManager = window.api.apiManager.current;

    act(() => {
      apiManager.sendAddedSignal('customresourcedefinitions', CRDmockResponse.items[11]);
    })

    expect(await screen.queryByText('SearchDomain')).not.toBeInTheDocument();
  }, testTimeout)

  test('CRD add with same resourceVersion of previous CRD', async () => {
    await setup();

    expect(await screen.findByText(/advertisement/i));

    let apiManager = window.api.apiManager.current;

    act(() => {
      apiManager.sendAddedSignal('customresourcedefinitions', CRDmockResponse.items[0]);
    })

    expect(await screen.queryByText('SearchDomain')).not.toBeInTheDocument();
  }, testTimeout)

  test('CRD watch and View watch return up if unexpectedly aborted', async () => {
    await setup();

    expect(await screen.findByText(/advertisement/i));

    let apiManager = window.api.apiManager.current;

    apiManager.sendAbortedConnectionSignal('customresourcedefinitions/');

    apiManager.sendAbortedConnectionSignal('views/');

    expect(window.api.watches.current).toHaveLength(3);
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

    Cookies.set('token', 'password');
    window.history.pushState({}, 'Page Title', '/apis/apiextensions.k8s.io/v1/customresourcedefinitions');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/No Data/i)).toBeInTheDocument();
  }, testTimeout)
})
