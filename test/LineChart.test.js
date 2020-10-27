import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LineChart from '../src/widgets/line/LineChart';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

describe('Status', () => {
  test('Line chart NaN data', async () => {
    render(
      <MemoryRouter>
        <LineChart data={[{"resource": "CPU", "date": "00:00:00", "value": NaN },
          {"resource": "RAM", "date": "00:00:00", "value": NaN }]} />
      </MemoryRouter>
    )
  }, testTimeout)
})
