import React from 'react';
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiInterface from '../src/services/api/ApiInterface';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import userEvent from '@testing-library/user-event';
import CR from '../src/resources/CRD/CR';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import LiqoDashAlteredMockResponse from '../__mocks__/liqodashtest_noSpec_noStatus.json';
import { setup_resource } from './RTLUtils';
import { MemoryRouter } from 'react-router-dom';
import AdvMockResponse from '../__mocks__/advertisement.json';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

function mockFetch() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: AdvMockResponse })));
    }
  })
}

async function setup(adv) {
  window.api = ApiInterface({id_token: 'test'});
  window.api.getCRDs().then(async () => {

    let liqo_crd = await window.api.getCRDFromKind('LiqoDashTest');
    let pie_crd = await window.api.getCRDFromKind('PieChart');
    let l = await window.api.getCustomResourcesAllNamespaces(liqo_crd);
    let p = await window.api.getCustomResourcesAllNamespaces(pie_crd);

    if(adv){
      let adv_crd = await window.api.getCRDFromKind('Advertisement');
      let a = await window.api.getCustomResourcesAllNamespaces(adv_crd);
      render(
        <MemoryRouter>
          <CR cr={a.body.items[0]}
              crd={adv_crd}
          />
        </MemoryRouter>
      )
    } else {
      render(
        <MemoryRouter>
          <CR cr={l.body.items[0]}
              crd={liqo_crd}
              template={p.body.items[0]}
          />
        </MemoryRouter>
      )
    }
  });
}

describe('CR', () => {
  test('CR shows every information', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    expect(screen.getByText('test-1')).toBeInTheDocument();
    expect(screen.getByLabelText('edit')).toBeInTheDocument();
    expect(screen.getByLabelText('delete')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  })

  test('CR edit drawer show on click', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();

    const edit = screen.getByLabelText('edit');
    userEvent.click(edit);

    expect(await screen.findByText(/update/i)).toBeInTheDocument();
  }, testTimeout)

  test('CR edit drawer closes', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();

    const edit = screen.getByLabelText('edit');
    userEvent.click(edit);

    const close = await screen.findByLabelText('Close');
    expect(close).toBeInTheDocument();
    userEvent.click(close);
  }, testTimeout)

  test('CR JSON show on click', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    userEvent.click(screen.getByText('test-1'));

    userEvent.click(screen.getByText('JSON'));

    expect(await screen.findByLabelText('json')).toBeInTheDocument();
  }, testTimeout)

  test('Metadata are showed in the CR', async () => {
    mockFetch();
    await setup(true);

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    userEvent.click(screen.getByText(/advertisement-/i));
    userEvent.click(await screen.findByText('Metadata'));
    userEvent.click(await screen.findByText('General'));
    expect(await screen.findByText('Self Link')).toBeInTheDocument();
    expect(await screen.findByText('Resource Version')).toBeInTheDocument();
  }, testTimeout)

  test('CR date-time picker works', async () => {
    mockFetch();
    await setup(true);

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    userEvent.click(screen.getByText(/advertisement-/i));
    userEvent.click(await screen.findByText('Spec'));
    userEvent.click(await screen.findByText('General'));
    let date = screen.getAllByRole('date-picker');
    let edit = screen.getAllByLabelText('edit');
    userEvent.click(edit[3]);
    userEvent.click(date[1]);
    userEvent.click(await screen.findByText('Now'));
    userEvent.click(await screen.findByText('Ok'));
  }, testTimeout)

  test('CR JSON show no spec or status when there is none', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
      } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
        return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashAlteredMockResponse })))
      } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
        return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
      }
    })
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    userEvent.click(screen.getByText('test-1'));

    userEvent.click(screen.getByText('JSON'));

    const json = await screen.findByLabelText('json');
    expect(json).toBeInTheDocument();
  }, testTimeout)

  test('CR delete popup show on click and resource is deleted', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('delete'));

    expect(await screen.findByText('Are you sure?')).toBeInTheDocument();

    const no = await screen.findByText('No');
    expect(no).toBeInTheDocument();

    const yes = await screen.findByText('Yes');
    expect(yes).toBeInTheDocument();

    userEvent.click(yes);
    expect(await screen.queryByAltText('test-1')).not.toBeInTheDocument();
  }, testTimeout)

  test('CR deletion error catch works', async () => {
    await setup_resource('401', 'DELETE', 'liqodashtests');

    const del = await screen.findAllByLabelText('delete');
    expect(del).toHaveLength(2);

    userEvent.click(del[0]);

    expect(await screen.findByText('Are you sure?')).toBeInTheDocument();
    const yes = await screen.findByText('Yes');
    userEvent.click(yes);

    expect(await screen.findByText(/401/i)).toBeInTheDocument();
  }, testTimeout)

})
