import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { generalHomeGET, loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import LiqoDashModifiedMockResponse from '../__mocks__/liqodashtest_modifiedCRD.json';
import LiqoDashAlteredMockResponse from '../__mocks__/liqodashtest_noSpec_noStatus.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import NoAnnNoResNoSch from '../__mocks__/no_Ann_noRes_noSch.json';
import ManyResources from '../__mocks__/manyResources.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import CRD from '../src/CRD/CRD';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import ConfigMockResponse from '../__mocks__/configs.json';

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
