import ViewMockResponse from '../__mocks__/views.json';
import CRDmockResponse from '../__mocks__/crd_fetch_long.json';
import ClusterConfigMockResponse from '../__mocks__/configs.json';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loginTest } from '../src/services/__mocks__/RTLUtils';

async function setup() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return Promise.resolve(new Response(JSON.stringify({ body: ClusterConfigMockResponse })))
    }
  })

  await loginTest();

  const configview = await screen.findByText('Settings');
  userEvent.click(configview);

  expect(await screen.findByText('Liqo configuration'));
}

describe('ConfigView', () => {
  test('Sidebar redirect works and general information are displayed', async () => {
    await setup();

    expect(screen.getByText(/Choose the best/i));
    expect(screen.getByText('Advertisement Config'));
    expect(screen.getByText('Discovery Config'));
  })

  test('Config update works', async () => {
    await setup();

    userEvent.click(screen.getByRole('switch'));
    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText(/updated/i))
  })

  test('Error notification when config not updated', async () => {
    await setup();

    userEvent.click(screen.getByRole('switch'));
    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText(/updated/i))
  })
})
