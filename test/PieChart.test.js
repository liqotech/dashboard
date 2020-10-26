import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiInterface from '../src/services/api/ApiInterface';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import PieMockResponseWrong from '../__mocks__/piecharts_wrong.json';
import PieChart from '../src/widgets/piechart/PieChart';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

async function setup(pie) {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: pie })))
    }
  })

  window.api = ApiInterface({id_token: 'test'});
  window.api.getCRDs().then(async () => {

    let liqo_crd = await window.api.getCRDFromKind('LiqoDashTest');
    let pie_crd = await window.api.getCRDFromKind('PieChart');
    let liqo_cr = await window.api.getCustomResourcesAllNamespaces(liqo_crd);
    let pie_cr = await window.api.getCustomResourcesAllNamespaces(pie_crd);

    render(
      <PieChart CR={liqo_cr.body.items[0].spec} template={pie_cr.body.items[0]}/>
    )
  });
}

describe('PieChart', () => {
  test('Pie chart is well formed', async () => {
    await setup(PieMockResponse);
  }, testTimeout)

  test('Pie chart show error when wrong input', async () => {
    await setup(PieMockResponseWrong);
    expect(await screen.findByText(/Something/i)).toBeInTheDocument();
  }, testTimeout)
})
