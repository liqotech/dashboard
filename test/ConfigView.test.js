import ViewMockResponse from '../__mocks__/views.json';
import CRDmockResponse from '../__mocks__/crd_fetch_long.json';
import ClusterConfigMockResponse from '../__mocks__/configs.json';
import { screen } from '@testing-library/react';
import Error409 from '../__mocks__/409.json';
import { loginTest } from './RTLUtils';
import userEvent from '@testing-library/user-event';

async function setup_with_error(error) {
  fetch.mockResponse(req => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      if (req.method === 'GET') {
        return Promise.resolve(new Response(JSON.stringify({ body: ClusterConfigMockResponse })))
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

  await loginTest();

  const configview = await screen.findByText('Settings');
  userEvent.click(configview);

  expect(await screen.findByText('Liqo configuration'));

}

describe('ConfigView', () => {
  test('Sidebar redirect works and general information are displayed', async () => {
    await setup_with_error();

    expect(screen.getByText(/Choose the best/i));
    expect(screen.getByText('Advertisement Config'));
    expect(screen.getByText('Discovery Config'));
  })

  test('Config update works', async () => {
    await setup_with_error();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    userEvent.click(screen.getByRole('switch'));
    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText(/updated/i));

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

  }, 30000)

  test('Error notification when config not updated', async () => {
    await setup_with_error('409');

    userEvent.click(screen.getByRole('switch'));
    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText('Could not update the configuration'))
  }, 30000)
})
