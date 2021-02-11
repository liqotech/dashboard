import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import {
  alwaysPresentGET,
  metricsPODs,
  mockCRDAndViewsExtended,
  setToken
} from './RTLUtils';
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
import Cookies from 'js-cookie';
import userEvent from '@testing-library/user-event';
import NamespaceResponse from '../__mocks__/namespaces.json';
import ApiInterface from '../src/services/api/ApiInterface';

fetchMock.enableMocks();

async function setup() {
  window.OIDC_PROVIDER_URL = 'test-url';
  window.OIDC_CLIENT_ID = 'test-id';

  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.OIDC_PROVIDER_URL = null;
  window.OIDC_CLIENT_ID = null;
  localStorage.setItem('theme', 'dark');
  Cookies.remove('token');
});

function mocks() {
  fetch.mockImplementation(url => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)));
    } else if (
      url ===
      'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions'
    ) {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)));
    } else if (url === 'http://localhost:3001/namespaces') {
      return Promise.resolve(
        new Response(JSON.stringify({ body: NamespaceResponse }))
      );
    } else if (
      url === 'http://localhost:3001/clustercustomobject/foreignclusters'
    ) {
      return Promise.resolve(
        new Response(JSON.stringify({ body: FCMockResponse }))
      );
    } else if (
      url === 'http://localhost:3001/clustercustomobject/advertisements'
    ) {
      return Promise.resolve(
        new Response(JSON.stringify({ body: AdvMockResponse }))
      );
    } else if (
      url === 'http://localhost:3001/clustercustomobject/peeringrequests'
    ) {
      return Promise.resolve(
        new Response(JSON.stringify({ body: PRMockResponse }))
      );
    } else if (
      url === 'http://localhost:3001/clustercustomobject/clusterconfigs'
    ) {
      return Promise.reject(Error404.body);
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(
        new Response(JSON.stringify({ body: ViewMockResponse }))
      );
    } else if (url === 'http://localhost:3001/pod') {
      return Promise.resolve(
        new Response(JSON.stringify({ body: PodsMockResponse }))
      );
    } else if (url === 'http://localhost:3001/nodes') {
      return Promise.resolve(
        new Response(JSON.stringify({ body: NodesMockResponse }))
      );
    } else if (url === 'http://localhost:3001/metrics/nodes') {
      return Promise.resolve(
        new Response(JSON.stringify(NodesMetricsMockResponse))
      );
    } else if (url === 'http://localhost:3001/configmaps/liqo') {
      return Promise.resolve(
        new Response(JSON.stringify({ body: CMMockResponse }))
      );
    } else if (alwaysPresentGET(url)) {
      return alwaysPresentGET(url);
    } else {
      return metricsPODs({ url: url });
    }
  });
}

describe('App', () => {
  test('Token wrong format', async () => {
    Cookies.set('token', 'token');
    window.OIDC_PROVIDER_URL = 'test-url';
    window.OIDC_CLIENT_ID = 'test-id';
    window.api = ApiInterface({ id_token: 'test' });
    window.history.pushState({}, 'Page Title', '/callback');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  });

  test(
    'Login with OIDC',
    async () => {
      mocks();

      await setup();

      /** Assert that a success notification has spawned */
      //expect(await screen.findByText(/custom views/i)).toBeInTheDocument();
      await userEvent.click(screen.getByLabelText('logout'));
    },
    testTimeout
  );

  test(
    'Login with OIDC error',
    async () => {
      mocks();

      window.error = true;

      await setup();
      await userEvent.click(screen.getByLabelText('logout'));

      window.error = false;
    },
    testTimeout
  );

  test('Login with path', async () => {
    mocks();
    setToken();
    window.history.pushState(
      {},
      'Page Title',
      '/apis/apiextensions.k8s.io/v1/customresourcedefinitions'
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Name'));
  });

  test('Plugin loader works', async () => {
    mocks();
    setToken();
    window.history.pushState({}, 'Page Title', '/liqo');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  });

  test('Access /login path when already logged redirect to /', async () => {
    mockCRDAndViewsExtended();
    setToken();
    window.history.pushState({}, 'Page Title', '/login');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Available Peers'));
  });

  test('Access /login path when not logged redirect to callback func', async () => {
    mockCRDAndViewsExtended();
    window.OIDC_PROVIDER_URL = 'test-url';
    window.OIDC_CLIENT_ID = 'test-id';
    window.history.pushState({}, 'Page Title', '/error');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  });

  test('Access /error path when already logged redirect to /', async () => {
    mockCRDAndViewsExtended();
    setToken();
    window.history.pushState({}, 'Page Title', '/error');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Available Peers'));
  });

  test('Access /callback path when already logged redirect to /', async () => {
    window.OIDC_PROVIDER_URL = 'test-url';
    window.OIDC_CLIENT_ID = 'test-id';
    mockCRDAndViewsExtended();
    setToken();
    window.history.pushState({}, 'Page Title', '/callback?state=1234567890');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Available Peers'));
  });

  test('Access an unknown route redirect to 404', async () => {
    mockCRDAndViewsExtended();
    setToken();
    window.history.pushState({}, 'Page Title', '/other');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('404'));
  });

  test('/callback', async () => {
    mockCRDAndViewsExtended();
    window.OIDC_PROVIDER_URL = 'test-url';
    window.OIDC_CLIENT_ID = 'test-id';
    window.api = ApiInterface({ id_token: 'test' });
    window.history.pushState({}, 'Page Title', '/callback');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  });
});
