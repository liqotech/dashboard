import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import ViewMockResponseLayout from '../__mocks__/views_withLayout.json';
import ViewMockModified from '../__mocks__/views_modified.json';
import ViewMockAltTemplate from '../__mocks__/views_alt_template.json';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCRDAndViewsExtended, setup_cv } from './RTLUtils';
import fetchMock from 'jest-fetch-mock';
import ApiInterface from '../src/services/api/ApiInterface';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import CustomView from '../src/views/CustomView';
import AdvMockResponse from '../__mocks__/advertisement.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import TunnMockResponse from '../__mocks__/tunnelendpoints.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import HistoMockResponse from '../__mocks__/histocharts.json';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

function mocks(view){
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: view })))
    } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: AdvMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      return Promise.resolve(new Response(JSON.stringify({ body: FCMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/tunnelendpoints') {
      return Promise.resolve(new Response(JSON.stringify({ body: TunnMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if( url === 'http://localhost:3001/clustercustomobject/piecharts' ) {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/histocharts') {
      return Promise.resolve(new Response(JSON.stringify({body: HistoMockResponse })))
    }
  })
}

async function setup(error) {
  window.api = ApiInterface({id_token: 'test'});
  window.api.getCRDs().then(() => {
    window.api.loadCustomViewsCRs().then(() => {
      if(error) window.api.customViews.current = [];

      render(
        <MemoryRouter>
          <CustomView match={{params: {viewName: 'awesome-view'}}}
                      history={[]}
          />
        </MemoryRouter>
      )
    });
  })
}

describe('CustomView', () => {
  test('Change CRD on custom view', async () => {
    mockCRDAndViewsExtended(null, 'PUT', 'advertisements', true);
    await setup();

    window.api.customViews.current = JSON.parse(JSON.stringify(ViewMockResponse.items));
    window.api.manageCallbackCVs();
    expect(await screen.findByText('Advertisement')).toBeInTheDocument();

    await window.api.updateCustomResourceDefinition(null, window.api.getCRDFromKind('Advertisement'));

    expect(await screen.findByText(/CRD advertisements.protocol.liqo.io modified/i));
  }, testTimeout)

  test('Custom view react if new CRD has been added', async () => {
    mocks(ViewMockResponse);
    await setup();

    expect(await screen.findByText('Test')).toBeInTheDocument();

    /** Modify the custom view */
    window.api.customViews.current = JSON.parse(JSON.stringify(ViewMockModified.items));
    act(() => {
      window.api.manageCallbackCVs();
    })

    expect(await screen.findByText('LiqoDashTest')).toBeInTheDocument();
  }, testTimeout)

  test('Pinned card works', async () => {
    await setup_cv(ViewMockResponse);
    const pin = await screen.findAllByLabelText('pushpin');

    userEvent.click(pin[0]);

  }, testTimeout)

  test('Custom view is empty if no Custom view', async () => {
    mocks(ViewMockResponseLayout);
    await setup(true);

    await new Promise((r) => setTimeout(r, 1000));

    await window.api.getCRDs();

    /** Modify the custom view */
    window.api.customViews.current = JSON.parse(JSON.stringify(ViewMockResponseLayout.items));
    act(() => {
      window.api.manageCallbackCVs();
    })

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();
  }, testTimeout)

  test('Custom view with layout', async () => {
    mocks(ViewMockResponseLayout);
    await setup();

    /** Modify the custom view */
    window.api.customViews.current = JSON.parse(JSON.stringify(ViewMockResponseLayout.items));
    window.api.manageCallbackCVs();

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();
  }, testTimeout)

  test('Change CR on custom view', async () => {
    mockCRDAndViewsExtended(null, 'PUT', 'advertisements', true);
    await setup();

    window.api.customViews.current = JSON.parse(JSON.stringify(ViewMockResponse.items));
    window.api.manageCallbackCVs();

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();

    await window.api.updateCustomResource(null, null, null, 'advertisements', null, AdvMockResponse);

    expect(await screen.findByText(/resource/i));
  }, testTimeout)

  test('Custom view shows alternative template', async () => {
    mocks(ViewMockAltTemplate);
    await setup();

    expect(await screen.findByText('Test')).toBeInTheDocument();
  }, testTimeout)

  test('Custom view gracefully unmount if CV has been deleted', async () => {
    mocks(ViewMockResponse);
    await setup();

    expect(await screen.findByText('Test')).toBeInTheDocument();

    let apiManager = window.api.apiManager.current;

    act(() => {
      apiManager.sendDeletedSignal('views/', ViewMockResponse.items[0]);
    })

    expect(await screen.findByText('TunnelEndpoint')).toBeInTheDocument();
  }, testTimeout)
})
