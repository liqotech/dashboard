import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import CRDmockLong from '../__mocks__/crd_fetch_long.json';
import ViewMockResponse from '../__mocks__/views.json';
import SchedulingNodesMockResponse from '../__mocks__/schedulingnodes.json';
import GraphMockResponse from '../__mocks__/graph.json';
import { MemoryRouter } from 'react-router-dom';
import GraphNet from '../src/templates/graph/GraphNet';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

async function setup_Graph(){
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockLong)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/schedulingnodes') {
      return Promise.resolve(new Response(JSON.stringify({ body: SchedulingNodesMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/graphs') {
      return Promise.resolve(new Response(JSON.stringify({ body: GraphMockResponse })))
    }
  })

  let api = new ApiManager();
  api.getCRDs().then(async () => {
    let liqo_crd = await api.getCRDfromKind('SchedulingNode');
    let pie_crd = await api.getCRDfromKind('Graph');
    let l = await api.getCustomResourcesAllNamespaces(liqo_crd);
    let p = await api.getCustomResourcesAllNamespaces(pie_crd);

    render (
      <MemoryRouter>
        <GraphNet custom_resources={l.body.items}
                  template={p.body.items[0]} />
      </MemoryRouter>
    )})
}

describe('GraphNet', () => {

  test('Graph works', async () => {
    await setup_Graph();

    expect(await screen.findByRole('button', {name: /cluster/i})).toHaveAttribute('disabled', '');
  }, testTimeout)
})
