import React from 'react';
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiInterface from '../src/services/api/ApiInterface';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import { setup_resource } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import LiqoDashUpdatedMockResponse from '../__mocks__/liqodashtest_update.json';
import UpdateCR from '../src/editors/CRD/UpdateCR';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';

fetchMock.enableMocks();

async function setup() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    }
  })

  window.api = ApiInterface({id_token: 'test'});
  await window.api.getCRDs().then(async () => {

    let crd = await api.getCRDFromKind('LiqoDashTest');
    let cr = await api.getCustomResourcesAllNamespaces(crd);

    render(
      <UpdateCR CR={cr.body.items[0]}
                CRD={crd}
                group={crd.spec.group}
                version={crd.spec.version}
                plural={crd.spec.names.plural}
                showUpdate={true}
      />
    )
  });
}

beforeEach(() => {
  Cookies.remove('token');
});

describe('UpdateCR', () => {
  test('CR drawer is present and text-editor is shown', async () => {
    await setup();

    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    expect(await screen.findByText('Form Wizard')).toBeInTheDocument();

    expect(screen.getByText('Submit')).toBeInTheDocument();
  }, testTimeout)

  test('CR is updated', async () => {
    await setup_resource();

    userEvent.click(screen.getAllByLabelText('edit')[1]);
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(LiqoDashUpdatedMockResponse));

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    const test = await screen.findByText('test-1');

    expect(test).toBeInTheDocument();

    userEvent.click(screen.getByRole('switch'));

    userEvent.click(test);

    userEvent.click(await screen.findByText('Spec'));

    const items = await screen.findAllByText('Item');
    userEvent.click(items[0]);

    expect(await screen.findAllByText('Cost')).toHaveLength(2);
    expect(screen.getAllByText('Name')).toHaveLength(2);

    const textboxes = await screen.findAllByRole('textbox');
    expect(textboxes[1]).toHaveAttribute('value', '13');
    expect(textboxes[2]).toHaveAttribute('value', 'green');
    expect(textboxes[3]).toHaveAttribute('value', '15');
    expect(textboxes[4]).toHaveAttribute('value', 'purple');
  }, testTimeout)

  test('Editor throws error when not valid body', async () => {
    await setup_resource();

    userEvent.click(screen.getAllByLabelText('edit')[1]);
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    await userEvent.type(screen.getByLabelText('editor'), '{"item": [{"cost": 11 "name": "green"}]}');

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    expect(await screen.findByText('JSON or YAML not valid')).toBeInTheDocument();
  }, testTimeout)

  test('Error notification when 409', async () => {
    await setup_resource('409', 'PUT');

    userEvent.click(screen.getAllByLabelText('edit')[1]);
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(LiqoDashUpdatedMockResponse));

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    expect(await screen.findByText('Could not update the resource')).toBeInTheDocument();
  }, testTimeout)
})
