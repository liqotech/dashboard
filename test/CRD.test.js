import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { generalHomeGET, loginTest } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import LiqoDashModifiedMockResponse from '../__mocks__/liqodashtest_modifiedCRD.json';
import LiqoDashAlteredMockResponse from '../__mocks__/liqodashtest_noSpec_noStatus.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import NoAnnNoResNoSch from '../__mocks__/no_Ann_noRes_noSch.json';
import ManyResources from '../__mocks__/manyResources.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import CRD from '../src/CRD/CRD';
import { MemoryRouter } from 'react-router-dom';

fetchMock.enableMocks();

let api;

async function setup() {
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);
}

async function setup_extended() {
  fetch.mockImplementation((url) => {
    return mocks(url);
  })

  await setup();

  let kind = screen.getByText('Advertisement');
  userEvent.click(kind);
}

function mocks(url) {
  if (url === 'http://localhost:3001/customresourcedefinition') {
    return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
  } else if (url === 'http://localhost:3001/clustercustomobject/views') {
    return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
  } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
    return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
  } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
    return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
  } else if (url === 'http://localhost:3001/clustercustomobject/noannnoresnoschemas') {
    return Promise.resolve(new Response(JSON.stringify({ body: NoAnnNoResNoSch })))
  } else if (url === 'http://localhost:3001/clustercustomobject/manyresources') {
    return Promise.resolve(new Response(JSON.stringify({ body: ManyResources })))
  } else {
    return generalHomeGET(url);
  }
}

async function setup_only_CRD() {
  fetch.mockImplementation((url) => {
    return mocks(url);
  })

  api = new ApiManager();
  api.getCRDs().then(async () => {
    render(
      <MemoryRouter>
        <CRD api={api}
             match={{
               params: {
                 crdName: 'liqodashtests.crd-template.liqo.com'
               }
             }}/>
      </MemoryRouter>
    )
  });
}

async function alwaysPresent(kind, descr) {
  expect(await screen.findByLabelText('crd')).toBeInTheDocument();
  expect(screen.getByText(kind)).toBeInTheDocument();
  expect(screen.getByText(descr)).toBeInTheDocument();
  expect(screen.getAllByLabelText('star')).toHaveLength(3);
  expect(screen.getByText('Annotations')).toBeInTheDocument();
  expect(screen.getByText('Resources')).toBeInTheDocument();
  expect(screen.getByText('Schema')).toBeInTheDocument();
  expect(screen.getAllByLabelText('layout')).toHaveLength(2);
  expect(screen.getByLabelText('picture')).toBeInTheDocument();
  expect(screen.getByLabelText('plus')).toBeInTheDocument();
}

describe('CRD', () => {
  test('CRD card shows every general information in different cases', async () => {
    fetch.mockImplementation((url) => {
      return mocks(url);
    })

    await setup();

    let row = screen.getByText('Advertisement');

    userEvent.click(row);

    await alwaysPresent('Advertisement','No description for this CRD');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    row = screen.getByText('LiqoDashTest');
    userEvent.click(row);

    /** This CRD contains a custom template and a description, so there has to be a switch and not the default description*/
    await alwaysPresent('LiqoDashTest','A test CRD for some implemetation on the liqo-dashboard');
    expect(screen.queryByRole('switch')).toBeInTheDocument();
  })

  test('Annotations tab works', async () => {
    fetch.mockImplementation((url) => {
      return mocks(url);
    })

    await setup();

    let kind = screen.getByText('Advertisement');
    userEvent.click(kind);

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    let annotations = screen.getByText('Annotations');
    userEvent.click(annotations);

    expect(screen.getByLabelText('tag')).toBeInTheDocument();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    kind = screen.getByText('NoAnnNoResNoSchema');
    userEvent.click(kind);

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    annotations = screen.getByText('Annotations');
    userEvent.click(annotations);

    expect(screen.getByText('No annotations'));
  })

  test('Resources tab works', async () => {
    fetch.mockImplementation((url) => {
      return mocks(url);
    })

    await setup();

    let kind = screen.getByText('NoAnnNoResNoSchema');
    userEvent.click(kind);

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    expect(screen.getByText('No resources present'));

    expect(screen.queryByLabelText('pagination')).not.toBeInTheDocument();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    kind = screen.getByText('Advertisement');
    userEvent.click(kind);

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();
    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    expect(screen.queryByLabelText('pagination')).not.toBeInTheDocument();

    userEvent.click(customview);

    kind = screen.getByText('ManyResource');
    userEvent.click(kind);

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();
    expect(await screen.findAllByLabelText('cr')).toHaveLength(5);
    expect(screen.queryByLabelText('pagination')).toBeInTheDocument();
  })

  test('Schema tab works', async () => {
    fetch.mockImplementation((url) => {
      return mocks(url);
    })

    await setup();

    let kind = screen.getByText('NoAnnNoResNoSchema');
    userEvent.click(kind);

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    let schema = screen.getByText('Schema');
    userEvent.click(schema);

    expect(screen.getByText('No schema for this CRD'));

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    kind = screen.getByText('Advertisement');
    userEvent.click(kind);

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    schema = screen.getByText('Schema');
    userEvent.click(schema);

    expect(await screen.findByLabelText('schema')).toBeInTheDocument();
  })

  test('Favourite are updated accordingly', async () => {
    await setup_extended();

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    const favCRD = screen.getAllByLabelText('star')[2];
    userEvent.click(favCRD);

    expect(await screen.findAllByText('Advertisement')).toHaveLength(2);

    userEvent.click(favCRD);

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();
  })

  test('Edit design drawer opens', async () => {
    await setup_extended();

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    const edit = screen.getByLabelText('picture');
    expect(edit).toBeInTheDocument();

    userEvent.click(edit);

    expect(await screen.findByText(/Customize the design for:/i))

    const close = screen.getAllByLabelText('close');
    userEvent.click(close[0]);
    userEvent.click(close[1]);
  })

  test('New CR drawer opens', async () => {
    await setup_extended();

    expect(await screen.findByLabelText('crd')).toBeInTheDocument();

    const plus = screen.getByLabelText('plus');
    expect(plus).toBeInTheDocument();

    userEvent.click(plus);

    expect(await screen.findByText(/Create a new/i));

    const close = screen.getAllByLabelText('close');
    userEvent.click(close[0]);
    userEvent.click(close[1]);
  })

  test('Templates are switched correctly', async () => {
    fetch.mockImplementation((url) => {
      return mocks(url);
    })

    await setup();

    let kind = screen.getByText('LiqoDashTest');
    userEvent.click(kind);

    /** This CRD contains a custom template and a description, so there has to be a switch and not the default description*/
    const switcher = await screen.findByRole('switch');
    expect(switcher).toBeInTheDocument();

    userEvent.click(screen.getByText('test-1'));
    expect(await screen.findByLabelText('piechart')).toBeInTheDocument();

    userEvent.click(switcher);
    userEvent.click(screen.getByText('Spec'));
    expect(await screen.findByLabelText('form_spec'));

    userEvent.click(screen.getByText('Status'));
    expect(await screen.findByLabelText('form_status'));
  })

  test('CR with no spec or status still works', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
      } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
        return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashAlteredMockResponse })))
      } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
        return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
      } else {
        return generalHomeGET(url);
      }
    })

    await setup();

    let kind = screen.getByText('LiqoDashTest');
    userEvent.click(kind);

    /** This CRD contains a custom template and a description, so there has to be a switch and not the default description*/
    const switcher = await screen.findByRole('switch');
    expect(switcher).toBeInTheDocument();
    userEvent.click(switcher);

    userEvent.click(screen.getByText('test-1'));

    expect(screen.queryByText('Spec')).not.toBeInTheDocument();
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  })

  test('CRD changes when external changes happen', async () => {
    await setup_only_CRD();

    expect(await screen.findByText('LiqoDashTest')).toBeInTheDocument();

    api.CRDsNotifyEvent('MODIFIED', LiqoDashModifiedMockResponse);

    expect(await screen.findByText('LiqoDashTestMod')).toBeInTheDocument();

    api = null;
  })
})
