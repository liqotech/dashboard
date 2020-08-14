import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { mockCRDAndViewsExtended } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';

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

describe('Home', () => {
  test('Foreign cluster updates', async () => {
    mockCRDAndViewsExtended(null, 'PUT', 'foreignclusters');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    api.createCustomResource(null, null, null, 'foreignclusters', null, null);
  })

  test('Advertisement updates', async () => {
    mockCRDAndViewsExtended(null, 'DELETE', 'advertisements');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    api.deleteCustomResource(null, null, null, 'advertisements', null);
  })

  test('Peering request updates', async () => {
    mockCRDAndViewsExtended(null, 'DELETE', 'peeringrequests');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    api.deleteCustomResource(null, null, null, 'peeringrequests', null);
  })

  test('Cluster config updates', async () => {
    mockCRDAndViewsExtended(null, 'DELETE', 'clusterconfigs');

    await setup();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

    api.updateCustomResource(null, null, null, 'clusterconfigs', null);
  })
})
