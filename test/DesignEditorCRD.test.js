import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiInterface from '../src/services/api/ApiInterface';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import CRDmockLong from '../__mocks__/crd_fetch_long.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import SchedNodesMockResponse from '../__mocks__/schedulingnodes.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import Error409 from '../__mocks__/409.json'
import userEvent from '@testing-library/user-event';
import { setup_resource } from './RTLUtils';
import DesignEditorCRD from '../src/editors/DesignEditorCRD';
import { MemoryRouter } from 'react-router-dom';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import GraphMockResponse from '../__mocks__/graph.json';

fetchMock.enableMocks();

async function setup(noCR, updateCRDError, createCRError) {
  fetch.mockResponse((req) => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      if(req.method === 'GET')
        return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
      else if(req.method === 'PUT'){
        if(updateCRDError)
          return Promise.reject(Error409.body);
        else
          return Promise.resolve();
      }
    } else if (req.url === 'http://localhost:3001/clustercustomobject/piecharts') {
      if(req.method === 'GET')
        return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
      else if(req.method === 'POST') {
        if (createCRError)
          return Promise.reject(Error409.body);
        else
          return Promise.resolve();
      }
    }
  })

  window.api = ApiInterface({id_token: 'test'});
  window.api.getCRDs().then(async () => {

    let crd = await window.api.getCRDFromKind('LiqoDashTest');

    render(
      <MemoryRouter>
        <DesignEditorCRD CR={noCR ? [] : LiqoDashMockResponse.items}
                         CRD={crd} showEditor={true}
        />
      </MemoryRouter>
    )
  });
}

async function setup_graphs() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockLong)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/schedulingnodes') {
      return Promise.resolve(new Response(JSON.stringify({ body: SchedNodesMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/graphs') {
      return Promise.resolve(new Response(JSON.stringify({body: GraphMockResponse })))
    }
  })

  window.api = ApiInterface({id_token: 'test'});
  window.api.getCRDs().then(async () => {

    let crd = await window.api.getCRDFromKind('SchedulingNode');

    render(
      <MemoryRouter>
        <DesignEditorCRD CR={SchedNodesMockResponse.items}
                         CRD={crd} showEditor={true}
        />
      </MemoryRouter>
    )
  });
}

beforeEach(() => {
  Cookies.remove('token');
});

async function fillFields(noMetadata){
  const name = screen.getAllByRole('textbox', {name: ''})[0];
  const namespace = screen.getAllByRole('textbox', {name: ''})[1];
  const labels = screen.getAllByRole('textbox', {name: ''})[2];
  const values = screen.getAllByRole('textbox', {name: ''})[3];

  expect(name).toBeInTheDocument();
  expect(namespace).toBeInTheDocument();
  expect(labels).toBeInTheDocument();
  expect(values).toBeInTheDocument();

  if(!noMetadata){
    await userEvent.type(name, 'test-2');
    await userEvent.type(namespace, 'test-ns');
  }
  await userEvent.type(labels, 'item.name');
  await userEvent.type(values, 'item.cost');

  const submit = screen.getByRole('button', {name: 'Submit'});
  userEvent.click(submit);
}

describe('DesignEditorCRD', () => {
  test('Design editor show all general information', async () => {
    await setup();

    expect(await screen.findByText('Template')).toBeInTheDocument();
    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');

    expect(screen.getByRole('button', {name: 'Save it'})).toHaveAttribute('disabled', "");
    expect(screen.getByLabelText('steps').querySelector(`[class="ant-steps-item ant-steps-item-process ant-steps-item-active"]`));

    expect(screen.getByText('Select design')).toBeInTheDocument();
    expect(screen.getByText('Submit values')).toBeInTheDocument();
    expect(screen.getByLabelText('steps').querySelector(`[class="ant-steps-item ant-steps-item-wait"]`)).toBeInTheDocument();
  }, testTimeout)

  test('Design editor form and preview show correct information when manually selected', async () => {
    await setup();

    const form = await screen.findByText('Form');
    userEvent.click(form);
    expect(await screen.findByText(/selected/i));

    const preview = screen.getByText('Preview');
    userEvent.click(preview);
    expect(await screen.findByText(/submitted/i));
  }, testTimeout)

  test('Design editor template tab show all information', async () => {
    await setup();

    await screen.findByText('Template');

    expect(screen.getByText('PieChart')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  }, testTimeout)

  test('Design editor template with graphs', async () => {
    await setup_graphs();

    await screen.findByText('Template');

    userEvent.click(screen.getByText('Graph'));

    expect(await screen.findByText('Metadata')).toBeInTheDocument();

    userEvent.click(screen.getByText('General'));

    const name = screen.getAllByRole('textbox', {name: ''})[0];
    const namespace = screen.getAllByRole('textbox', {name: ''})[1];
    const node = screen.getAllByRole('textbox', {name: ''})[2];

    expect(name).toBeInTheDocument();
    expect(namespace).toBeInTheDocument();
    expect(node).toBeInTheDocument();

    await userEvent.type(name, 'test-2');
    await userEvent.type(namespace, 'test-ns');
    await userEvent.type(node, 'nodeName');

    const submit = screen.getByRole('button', {name: 'Submit'});
    userEvent.click(submit);
  }, testTimeout)

  test('Design editor tabs change properly', async () => {
    await setup();

    await screen.findByText('Template');

    userEvent.click(screen.getByText('PieChart'));

    expect(await screen.findByText('Metadata')).toBeInTheDocument();

    await fillFields();
  }, testTimeout)

  test('Design editor tabs change properly when no possible preview', async () => {
    await setup(true);

    await screen.findByText('Template');

    userEvent.click(screen.getByText('PieChart'));

    expect(await screen.findByText('Metadata')).toBeInTheDocument();

    await fillFields();
  }, testTimeout)

  test('Form generator throws error when no valid values in required field', async () => {
    await setup();

    await screen.findByText('Template');

    userEvent.click(screen.getByText('PieChart'));

    expect(await screen.findByText('Metadata')).toBeInTheDocument();

    await fillFields(true);

    expect(await screen.findByText(/Please/i));
  }, testTimeout)

  test('Definition of a new template works', async () => {
    await setup_resource();

    userEvent.click(await screen.findByLabelText('picture'));

    await screen.findByText('Template');

    userEvent.click(screen.getByText('HistoChart'));

    await fillFields();

    expect(await screen.findByText(/Showing preview for/i)).toBeInTheDocument();

    expect(await screen.findAllByLabelText('check')).toHaveLength(2);

    userEvent.click(screen.getByRole('button', {name: 'Save it'}));

    expect(await screen.findByText('CRD modified')).toBeInTheDocument();

    await userEvent.click(await screen.findByText('test-1'));
  }, testTimeout)

  test('Default template overrides old template', async () => {
    await setup_resource();

    userEvent.click(await screen.findByLabelText('picture'));

    await screen.findByText('Template');

    userEvent.click(screen.getByText('Default'));

    userEvent.click(screen.getByRole('button', {name: 'Save it'}));


    await userEvent.click(await screen.findByText('test-1'));
    userEvent.click(await screen.findByText('Spec'));
    expect(await screen.findByLabelText('form_spec')).toBeInTheDocument();

    expect(await screen.queryAllByText('Item')).toHaveLength(2);
  }, testTimeout)

  test('Design editor error on creating template', async () => {
    await setup(false, false, true);

    await screen.findByText('Template');

    userEvent.click(screen.getByText('PieChart'));

    expect(await screen.findByText('Metadata')).toBeInTheDocument();

    await fillFields();

    userEvent.click(screen.getByRole('button', {name: 'Save it'}));

    expect(await screen.findByText('Could not create the resource')).toBeInTheDocument();
  }, testTimeout)

  test('Design editor error on updating CRD', async () => {
    await setup(false, true);

    await screen.findByText('Template');

    userEvent.click(screen.getByText('Default'));

    userEvent.click(screen.getByRole('button', {name: 'Save it'}));

    expect(await screen.findByText('Could not update the CRD')).toBeInTheDocument();
  }, testTimeout)
})
