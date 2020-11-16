import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testTimeout } from '../src/constants';
import { generalMocks, loginTest, mockCRDAndViewsExtended, setToken } from './RTLUtils';
import Cookies from 'js-cookie';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import React from 'react';
import fetchMock from 'jest-fetch-mock';
import Error401 from '../__mocks__/401.json';
import K8sSchemaDefinitions from '../__mocks__/kubernetesjsonschema.json';

fetchMock.enableMocks();

jest.mock('../src/services/api/ApiManager');

async function setup() {
  mockCRDAndViewsExtended();
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  expect(await screen.findByText(/advertisement./i)).toBeInTheDocument();

  expect(screen.getAllByRole('row')).toHaveLength(10);
}

function mocks(errorSchema){
  fetch.mockResponse(req => {
    if (req.url === 'https://kubernetesjsonschema.dev/master/_definitions.json'){
      if(!errorSchema)
        return Promise.resolve(new Response(JSON.stringify(K8sSchemaDefinitions)))
      else return Promise.reject(404);
    }
    if(generalMocks(req.url))
      return generalMocks(req.url);
  })
}

async function addImage(){
  userEvent.click(await screen.findByLabelText('insert-row-right'));

  expect(await screen.findByLabelText('save')).toBeInTheDocument();
  expect(await screen.findByLabelText('close')).toBeInTheDocument();

  let select = await screen.findAllByLabelText('select-k8s');
  userEvent.click(select[1]);
  await userEvent.type(select[1], 'image');

  let image = await screen.findAllByText('image');

  fireEvent.mouseOver(image[3]);
  fireEvent.click(image[3]);

  userEvent.click(await screen.findByLabelText('save'));

  expect(await screen.findByText('Image')).toBeInTheDocument();
  expect(await screen.findAllByText('nappozord/kube-test:v0.1')).toHaveLength(4)
}

beforeEach(() => {
  Cookies.remove('token');
});

describe('Column Customization', () => {
  test('Add a column when config do not already exist', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    expect(await screen.findByText('Pod')).toBeInTheDocument();

    await addImage();

  }, testTimeout)

  test('Add a column when config already exist but no render column', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    let stars = await screen.findAllByLabelText('star');

    userEvent.click(stars[1]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    await addImage();

  }, testTimeout)

  test('Add then remove column', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);
    await userEvent.type(select[1], 'resourceVersion');

    let resourceVersion = await screen.findAllByText('resourceVersion');

    fireEvent.mouseOver(resourceVersion[3]);
    fireEvent.click(resourceVersion[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText('Resourceversion')).toBeInTheDocument();
    userEvent.click(await screen.findByText('Resourceversion'));

    let textbox = await screen.findByLabelText('editColumn');

    textbox.setSelectionRange(0, 20);
    await userEvent.type(textbox, '{backspace}{enter}');

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('Resourceversion')).not.toBeInTheDocument();

  }, testTimeout)

  test('Add then modify column title', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);
    await userEvent.type(select[1], 'resourceVersion');

    let resourceVersion = await screen.findAllByText('resourceVersion');

    fireEvent.mouseOver(resourceVersion[3]);
    fireEvent.click(resourceVersion[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText('Resourceversion')).toBeInTheDocument();
    userEvent.click(await screen.findByText('Resourceversion'));

    let textbox = await screen.findByLabelText('editColumn');

    await userEvent.type(textbox, '2');

    userEvent.click(screen.getByText('Namespace'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('Resourceversion2')).toBeInTheDocument();

  }, testTimeout)

  test('Add column with text', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], "'/'{enter}");
    await userEvent.type(select[1], 'resourceVersion');

    let resourceVersion = await screen.findAllByText('resourceVersion');

    fireEvent.mouseOver(resourceVersion[3]);
    fireEvent.click(resourceVersion[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/Resourceversion/i)).toBeInTheDocument();

  }, testTimeout)

  test('Add column with object', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], 'metadata');

    let metadata = await screen.findAllByText('metadata');

    fireEvent.mouseOver(metadata[3]);
    fireEvent.click(metadata[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/metadata/i)).toBeInTheDocument();

  }, testTimeout)

  test('Add column with object and text', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], "'/'{enter}");
    await userEvent.type(select[1], 'metadata');

    let metadata = await screen.findAllByText('metadata');

    fireEvent.mouseOver(metadata[3]);
    fireEvent.click(metadata[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/metadata/i)).toBeInTheDocument();
    expect(await screen.findAllByText(/object is not/i)).toHaveLength(4);

  }, testTimeout)

  test('Add column with object and text then delete', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], "'/'{enter}");
    await userEvent.type(select[1], 'metadata');

    let metadata = await screen.findAllByText('metadata');

    fireEvent.mouseOver(metadata[3]);
    fireEvent.click(metadata[3]);

    let close = await screen.findAllByLabelText('close');

    userEvent.click(close[0]);
    userEvent.click(close[1]);
    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();

  }, testTimeout)

  test('Add column with array (of object)', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], 'containers');

    let containers = await screen.findAllByText('containers');

    fireEvent.mouseOver(containers[3]);
    fireEvent.click(containers[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/containers/i)).toBeInTheDocument();
    expect(await screen.findAllByText('1')).toHaveLength(4);

  }, testTimeout)

  test('Add column with booleans', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], 'enableServiceLinks');

    let enableServiceLinks = await screen.findAllByText('enableServiceLinks');

    fireEvent.mouseOver(enableServiceLinks[3]);
    fireEvent.click(enableServiceLinks[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/enableServiceLinks/i)).toBeInTheDocument();
    expect(await screen.findAllByLabelText('check-circle'));
    expect(await screen.findAllByLabelText('exclamation-circle')).toHaveLength(1);

  }, testTimeout)

  test('Add column with array but empty', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], 'volumes');

    let volumes = await screen.findAllByText('volumes');

    fireEvent.mouseOver(volumes[3]);
    fireEvent.click(volumes[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/volumes/i)).toBeInTheDocument();

  }, testTimeout)

  test('Add column with array (of bool)', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], 'containerStatuses');

    let containerStatuses = await screen.findAllByText('containerStatuses');

    fireEvent.mouseOver(containerStatuses[3]);
    fireEvent.click(containerStatuses[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/containerStatuses/i)).toBeInTheDocument();

  }, testTimeout)

  test('Add column with empty objects', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 500));
      window.api.dashConfigs.current.spec.resources.push({
        resourceName: 'Pod',
        resourcePath: '/api/v1/pods',
        favourite: false
      })
      window.api.manageCallbackDCs();
      await new Promise((r) => setTimeout(r, 500));
    })

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], 'annotations');

    let annotations = await screen.findAllByText('annotations');

    fireEvent.mouseOver(annotations[3]);
    fireEvent.click(annotations[3]);

    userEvent.click(await screen.findByLabelText('save'));

    expect(await screen.findByText(/annotations/i)).toBeInTheDocument();

  }, testTimeout)

  test('Cancel add column', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    userEvent.click(await screen.findByLabelText('insert-row-right'));

    expect(await screen.findByLabelText('save')).toBeInTheDocument();
    expect(await screen.findByLabelText('close')).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText('save'));
    userEvent.click(await screen.findByLabelText('close'));

    expect(await screen.queryByLabelText('save')).not.toBeInTheDocument();
  }, testTimeout)
})
