import React from 'react';
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiManager from '../src/services/__mocks__/ApiManager';
import userEvent from '@testing-library/user-event';
import CR from '../src/CRD/CR';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import { MemoryRouter } from 'react-router-dom';
import AdvMockResponse from '../__mocks__/advertisement.json';
import ClusterConfigMockResponse from '../__mocks__/configs.json';
import Error409 from '../__mocks__/409.json';

fetchMock.enableMocks();

function mockFetch(error) {
  fetch.mockResponse(req => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/advertisements') {
      if (req.method === 'GET') {
        return Promise.resolve(new Response(JSON.stringify({ body: AdvMockResponse })))
      } else if (req.method === 'PUT') {
        if (error) {
          if (error === '409') {
            return Promise.reject(Error409.body);
          }
        } else {
          let ClusterConfigMockResponseMod = ClusterConfigMockResponse.items[0];
          ClusterConfigMockResponseMod.resourceVersion++;
          ClusterConfigMockResponseMod.spec.advertisementConfig.autoAccept = false;
          return Promise.resolve(new Response(JSON.stringify({ body: ClusterConfigMockResponseMod })))
        }
      }
    }
  })
}

async function setup() {
  let api = new ApiManager();
  api.getCRDs().then(async () => {

    let adv_crd = await api.getCRDfromKind('Advertisement');
    let adv = await api.getCustomResourcesAllNamespaces(adv_crd);

    render(
      <MemoryRouter>
        <CR api={api}
            cr={adv.body.items[0]}
            crd={adv_crd}
        />
      </MemoryRouter>
    )
  });
}

async function edit() {
  let edit = await screen.findAllByLabelText('edit');

  userEvent.click(edit[1]);

  let textbox = await screen.findAllByRole('textbox');

  await userEvent.type(textbox[0], 'test');

  userEvent.click(screen.getByLabelText('close'));

  expect(await screen.findByText('Discard changes?'))
}

async function check() {
  expect(await screen.findByLabelText('cr')).toBeInTheDocument();
  expect(screen.getByText('advertisement-8d73c01a-f23a-45dc-822b-7d3232683f53')).toBeInTheDocument();
  expect(screen.getByLabelText('edit')).toBeInTheDocument();
  expect(screen.getByLabelText('delete')).toBeInTheDocument();
  expect(screen.getByText('JSON')).toBeInTheDocument();
}

describe('FormViewer', () => {
  test('FormViewer shows every information and do not changes parameters', async () => {
    mockFetch();

    await setup();
    await check();

    userEvent.click(screen.getByText(/advertisement-/i));
    userEvent.click(await screen.findByText('General'));
    userEvent.click(await screen.findByText('Network'));

    await edit();

    userEvent.click(await screen.findByText('Yes'));
  }, 30000)

  test('FormViewer shows every information and changes parameters', async () => {
    mockFetch();

    await setup();
    await check();

    userEvent.click(screen.getByText(/advertisement-/i));
    userEvent.click(await screen.findByText('General'));
    userEvent.click(await screen.findByText('Limit Range'));
    userEvent.click(await screen.findByText('Limits'));
    let general = await screen.findAllByText('General');
    userEvent.click(general[1]);
    userEvent.click(await screen.findByText('Max'));

    await edit();

    userEvent.click(await screen.findByText('No'));

    expect(screen.getByText('Save changes')).toBeInTheDocument();

    userEvent.click(screen.getByText('Save changes'));
  }, 30000)
})
