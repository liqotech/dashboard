import React from 'react';
import { findByRole, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiManager from '../src/services/__mocks__/ApiManager';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import userEvent from '@testing-library/user-event';
import { setup_resource } from './RTLUtils';
import DesignEditorCRD from '../src/editors/DesignEditorCRD';
import { MemoryRouter } from 'react-router-dom';

fetchMock.enableMocks();

async function setup() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    }
  })

  let api = new ApiManager();
  api.getCRDs().then(async () => {

    let crd = await api.getCRDfromKind('LiqoDashTest');
    let cr = await api.getCustomResourcesAllNamespaces(crd);

    render(
      <MemoryRouter>
        <DesignEditorCRD CR={cr.body.items[0]}
                         CRD={crd}
                         api={api}
        />
      </MemoryRouter>
    )
  });
}

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
    userEvent.type(name, 'test-2');
    userEvent.type(namespace, 'test-ns');
  }
  userEvent.type(labels, 'item.name');
  userEvent.type(values, 'item.cost');

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

    expect(screen.getByRole('button')).toHaveAttribute('disabled', "");
    expect(screen.getByLabelText('steps').querySelector(`[class="ant-steps-item ant-steps-item-process ant-steps-item-active"]`));

    expect(screen.getByText('Select design')).toBeInTheDocument();
    expect(screen.getByText('Submit values')).toBeInTheDocument();
    expect(screen.getByLabelText('steps').querySelector(`[class="ant-steps-item ant-steps-item-wait"]`)).toBeInTheDocument();
  })

  test('Design editor form and preview show correct information when manually selected', async () => {
    await setup();

    const form = await screen.findByText('Form');
    userEvent.click(form);
    expect(await screen.findByText(/please/i));

    const preview = screen.getByText('Preview');
    userEvent.click(preview);
    expect(await screen.findByText(/submit to see/i));
  })

  test('Design editor template tab show all information', async () => {
    await setup();

    await screen.findByText('Template');

    expect(screen.getByText('PieChart')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  })

  test('Design editor tabs change properly', async () => {
    await setup();

    await screen.findByText('Template');

    userEvent.click(screen.getByText('PieChart'));

    expect(await screen.findByText('Metadata')).toBeInTheDocument();

    await fillFields();
  })

  test('Form generator throws error when no valid values in required field', async () => {
    await setup();

    await screen.findByText('Template');

    userEvent.click(screen.getByText('PieChart'));

    expect(await screen.findByText('Metadata')).toBeInTheDocument();

    await fillFields(true);

    expect(await screen.findByText(/Please/i));
  })

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

  }, 30000)

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
  }, 30000)
})
