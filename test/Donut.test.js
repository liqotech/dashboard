import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Donut from '../src/templates/donut/Donut';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

describe('Donut', () => {
  test('Line chart NaN data', async () => {
    render(
      <MemoryRouter>
        <Donut data={[{"resource": "CPU", "date": "00:00:00", "value": "14" }]} />
      </MemoryRouter>
    )
  }, testTimeout)
})
