import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { testTimeout } from '../src/constants';
import CustomFieldTemplate, { checkChildren } from '../src/editors/OAPIV3FormGenerator/CustomFieldTemplate';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

fetchMock.enableMocks();

describe('OAPIV3', () => {
  test('No properties in schema', async () => {
    checkChildren({schema: {}});
  }, testTimeout)

  test('Footer is present', async () => {
    render(
      <MemoryRouter>
        <CustomFieldTemplate schema={{
          __additional_property: true,
          type: 'add_p',
        }}
                             id={'0'}
                             label={'label'}
                             onKeyChange={() => {}}
        />
      </MemoryRouter>
    )

    await userEvent.type(await screen.findByDisplayValue('label'), 'l')
  }, testTimeout)
})
