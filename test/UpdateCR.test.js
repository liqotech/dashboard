import React from 'react';
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiManager from '../src/services/__mocks__/ApiManager';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import { setup_resource } from '../src/services/__mocks__/RTLUtils';
import userEvent from '@testing-library/user-event';
import LiqoDashUpdatedMockResponse from '../__mocks__/liqodashtest_update.json';
import UpdateCR from '../src/editors/UpdateCR';

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

  let api = new ApiManager();
  api.getCRDs().then(async () => {

    let crd = await api.getCRDfromKind('LiqoDashTest');
    let cr = await api.getCustomResourcesAllNamespaces(crd);

    render(
      <UpdateCR CR={cr.body.items[0]}
                group={crd.spec.group}
                version={crd.spec.version}
                plural={crd.spec.names.plural}
                api={api}
      />
    )
  });
}

describe('UpdateCR', () => {
  test('CR drawer is present and text-editor is shown', async () => {
    await setup();

    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');

    expect(screen.getByRole('button')).toBeInTheDocument();
    //expect(screen.getByRole('tabpanel').querySelector(`[class="ace_content"]`)).toBeInTheDocument();
  })

  test('CR is updated', async () => {
    await setup_resource();

    userEvent.click(screen.getAllByLabelText('edit')[0]);
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(LiqoDashUpdatedMockResponse));

    userEvent.click(screen.getByRole('button', {name: 'OK'}));

    const test = await screen.findByText('test-1');

    expect(test).toBeInTheDocument();

    userEvent.click(screen.getByRole('switch'));

    userEvent.click(test);

    userEvent.click(await screen.findByText('Spec'));

    expect(await screen.findByText('cost'));
    expect(screen.getByText('name'));
    expect(screen.getByText('green'));
    expect(screen.getByText('purple'));
    expect(screen.getByText('13'));
    expect(screen.getByText('15'));
  }, 30000)

  test('Editor throws error when not valid body', async () => {
    await setup_resource();

    userEvent.click(screen.getAllByLabelText('edit')[0]);
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('editor'), '{"item": [{"cost": 11 "name": "green"}]}');

    userEvent.click(screen.getByRole('button', {name: 'OK'}));

    expect(await screen.findByText('JSON or YAML not valid')).toBeInTheDocument();
  }, 30000)

  test('Error notification when 409', async () => {
    await setup_resource('409', 'PUT');

    userEvent.click(screen.getAllByLabelText('edit')[0]);
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(LiqoDashUpdatedMockResponse));

    userEvent.click(screen.getByRole('button', {name: 'OK'}));

    expect(await screen.findByText('Could not update the resource')).toBeInTheDocument();
  }, 30000)
})
