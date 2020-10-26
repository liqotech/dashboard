import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiInterface from '../src/services/api/ApiInterface';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import HistoMockResponse from '../__mocks__/histocharts.json';
import HistoMockResponseWrong from '../__mocks__/histocharts_wrong.json';
import HistoChart from '../src/widgets/histogram/HistoChart';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

async function setup(histo) {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/histocharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: histo })))
    }
  })

  window.api = ApiInterface({id_token: 'test'});
  await window.api.getCRDs().then(async () => {

    let liqo_crd = await api.getCRDFromKind('LiqoDashTest');
    let histo_crd = await api.getCRDFromKind('HistoChart');
    let liqo_cr = await api.getCustomResourcesAllNamespaces(liqo_crd);
    let histo_cr = await api.getCustomResourcesAllNamespaces(histo_crd);

    render(
      <HistoChart CR={liqo_cr.body.items[0].spec} template={histo_cr.body.items[0]}/>
    )
  });
}

describe('HistoChart', () => {
  test('Histogram chart is well formed', async () => {
    await setup(HistoMockResponse);
  }, testTimeout)

  test('Histogram chart shows error when wrong input', async () => {
    await setup(HistoMockResponseWrong);
    expect(await screen.findByText(/Something/i)).toBeInTheDocument();
  }, testTimeout)
})
