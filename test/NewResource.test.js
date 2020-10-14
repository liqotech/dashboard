import React from 'react';
import { findByText, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ApiInterface from '../src/services/api/ApiInterface';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import LiqoDashNewMockResponse from '../__mocks__/liqodashtest_new.json';
import NoAnnNoResNoSch from '../__mocks__/no_Ann_noRes_noSch.json';
import userEvent from '@testing-library/user-event';
import { mockCRDAndViewsExtended } from './RTLUtils';
import NewResource from '../src/editors/CRD/NewResource';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';

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
  window.api.getCRDs().then(async () => {

    let liqo_crd = await window.api.getCRDFromKind('LiqoDashTest');

    render(
      <NewResource resource={liqo_crd}
                   showCreate={true}
      />
    )
  });
}

async function check_new_CR(){

  const test = await screen.findByText('test-3');

  expect(screen.getAllByLabelText('cr')).toHaveLength(3);

  expect(test).toBeInTheDocument();

  userEvent.click(screen.getByRole('switch'));

  userEvent.click(test);

  userEvent.click(await screen.findByText('Spec'));

  const items = await screen.findAllByText('Item');

  userEvent.click(items[0]);

  expect(await screen.findAllByText('Cost')).toHaveLength(2);
  expect(screen.getAllByText('Name')).toHaveLength(3);

  const textboxes = await screen.findAllByRole('textbox');
  expect(textboxes[1]).toHaveAttribute('value', '1');
  expect(textboxes[2]).toHaveAttribute('value', 'cyan');
  expect(textboxes[3]).toHaveAttribute('value', '2');
  expect(textboxes[4]).toHaveAttribute('value', 'orange');
}

beforeEach(() => {
  Cookies.remove('token');
});

async function setup_resources(error, method, crd){
  mockCRDAndViewsExtended(error, method, crd);
  Cookies.set('token', 'password');
  window.history.pushState({}, 'Page Title', '/customresources/liqodashtests.dashboard.liqo.io');

  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByLabelText('plus')).toBeInTheDocument();
}

describe('NewResource', () => {
  test('CR drawer is present and form wizard is the first tab selected', async () => {
    await setup();

    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    expect(screen.getByText('Form Wizard')).toBeInTheDocument();

    expect(screen.getByText('Submit'));
  }, testTimeout)

  test('CR form generator tab is not present when no schema', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      } else if (url === 'http://localhost:3001/clustercustomobject/noannnoresnoschemas') {
        return Promise.resolve(new Response(JSON.stringify({ body: NoAnnNoResNoSch })))
      }
    })

    window.api = ApiInterface({id_token: 'test'});
    window.api.getCRDs().then(async () => {

      let noschema_crd = await window.api.getCRDFromKind('NoAnnNoResNoSchema');

      render(
        <NewResource resource={noschema_crd}
                     showCreate={true}
        />
      )
    });

    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    expect(screen.queryByText('Form Wizard')).not.toBeInTheDocument();
  }, testTimeout)

  test('CR second tab show the form generator properly', async () => {
    await setup();

    userEvent.click(await screen.findByText('Form Wizard'));

    expect(await screen.findByText('Metadata'));

    expect(screen.getByText('Submit')).toBeInTheDocument();

    expect(screen.getByText('Item')).toBeInTheDocument();
    userEvent.click(screen.getByText('Item'));

    const button = screen.getByText('Add Item');
    userEvent.click(button);

    expect(await screen.findByText('Cost')).toBeInTheDocument();
    expect(await screen.findAllByText('Name')).toHaveLength(2);
  }, testTimeout)

  test('Error message if no value inserted', async () => {
    await setup();

    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    userEvent.click(screen.getByText('Save'));

    expect(await screen.findByText(/errors/i)).toBeInTheDocument();
  }, testTimeout)

  test('Error message if no name in form generator', async () => {
    await setup();

    userEvent.click(await screen.findByText('Form Wizard'));

    expect(await screen.findByText('Metadata'));
    userEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText(/Please/i)).toBeInTheDocument();
  }, testTimeout)

  test('Error message when wrong metadata', async () => {
    await setup();

    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    await userEvent.type(screen.getByLabelText('editor'), '{"name": "test", "namespace": "test"}');

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    expect(await screen.findAllByText(/errors/i)).toHaveLength(2);
  }, testTimeout)

  test('Error message when wrong input (YAML)', async () => {
    await setup();

    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    await userEvent.type(screen.getByLabelText('editor'), 'name: "test", {"namespace" test');

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    expect(await screen.findAllByText(/not valid/i)).toHaveLength(1);
  }, testTimeout)

  test('Correct creation of a CR from editor', async () => {
    await setup_resources();

    userEvent.click(screen.getByLabelText('plus'));
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(LiqoDashNewMockResponse));

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    await check_new_CR();
  }, testTimeout)

  test('Correct creation of a CR from form', async () => {
    await setup_resources();

    userEvent.click(screen.getByLabelText('plus'));

    const form = await screen.findByText('Form Wizard');
    userEvent.click(form);

    let textbox = await screen.findAllByRole('textbox', {name: ''});

    expect(textbox).toHaveLength(2);

    await userEvent.type(textbox[0], 'test');
    await userEvent.type(textbox[1], 'test-ns');

    userEvent.click(await screen.findByText('Item'));

    userEvent.click(await screen.findByText('Add Item'));

    await screen.findByText('Cost');

    textbox = await screen.findAllByRole('textbox', {name: ''});

    await userEvent.type(textbox[2], '1');
    await userEvent.type(textbox[3], 'cyan');

    userEvent.click(await screen.findByText('Add Item'));

    textbox = await screen.findAllByRole('textbox', {name: ''});

    await userEvent.type(textbox[4], '2');
    await userEvent.type(textbox[5], 'orange');

    userEvent.click(screen.getByRole('button', {name: 'Submit'}));

    await check_new_CR();
  }, testTimeout)

  test('Error notification when 409', async () => {
    await setup_resources('409', 'POST');

    userEvent.click(screen.getByLabelText('plus'));
    expect(await screen.findByText('JSON/YAML')).toBeInTheDocument();
    userEvent.click(screen.getByText('JSON/YAML'));

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(LiqoDashNewMockResponse));

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    expect(await screen.findByText(/Could not/i)).toBeInTheDocument();
  }, testTimeout)
})
