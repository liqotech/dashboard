import ViewMockResponse from '../__mocks__/views.json';
import CRDmockResponse from '../__mocks__/crd_fetch_long.json';
import ClusterConfigMockResponse from '../__mocks__/configs.json';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loginTest } from './RTLUtils';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import Error409 from '../__mocks__/409.json';
import LiqoDashUpdatedMockResponse from '../__mocks__/liqodashtest_update.json';

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
          ClusterConfigMockResponse.items[0].resourceVersion++;
          return Promise.resolve(new Response(JSON.stringify({ body: ClusterConfigMockResponse })))
        }
      }
    }
  })

  await loginTest();

  const configview = await screen.findByText('Settings');
  userEvent.click(configview);

  expect(await screen.findByText('Liqo configuration'));

}

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
    await setup_with_error();

    expect(screen.getByText(/Choose the best/i));
    expect(screen.getByText('Advertisement Config'));
    expect(screen.getByText('Discovery Config'));
  })

  test('Config update works', async () => {
    await setup_with_error();

    userEvent.click(screen.getByRole('switch'));
    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText(/updated/i))
  }, 30000)

  test('Error notification when config not updated', async () => {
    await setup_with_error('409');

    userEvent.click(screen.getByRole('switch'));
    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText('Could not update the configuration'))
  }, 30000)
})
