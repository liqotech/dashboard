import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import Error401 from '../__mocks__/401.json';
import NamespaceResponse from '../__mocks__/namespaces.json';
import {
  alwaysPresentGET,
  generalHomeGET,
  setToken,
  setup_login,
  token
} from './RTLUtils';
import Cookies from 'js-cookie';
import { testTimeout } from '../src/constants';
import React from 'react';
import fetchMock from 'jest-fetch-mock';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import NamespaceSelect from '../src/common/NamespaceSelect';
import ApiInterface from '../src/services/api/ApiInterface';

fetchMock.enableMocks();

async function setup_extended(errorCRD) {
  fetch.mockResponse(req => {
    return mocks(req, undefined, errorCRD);
  });

  setToken();
  window.history.pushState(
    {},
    'Page Title',
    '/customresources/views.dashboard.liqo.io'
  );

  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}

let counter = 0;

function mocks(req, error, errorCRD) {
  if (req.url === 'http://localhost:3001/customresourcedefinition') {
    return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)));
  } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
    if (errorCRD && counter !== 0) {
      return Promise.reject(Error401.body);
    }
    return Promise.resolve(
      new Response(JSON.stringify({ body: ViewMockResponse }))
    );
  } else if (req.url === 'http://localhost:3001/namespaces') {
    if (!error)
      return Promise.resolve(
        new Response(JSON.stringify({ body: NamespaceResponse }))
      );
    else return Promise.reject(Error401.body);
  } else if (alwaysPresentGET(req.url)) {
    return alwaysPresentGET(req.url);
  } else {
    return generalHomeGET(req.url);
  }
}

beforeEach(() => {
  localStorage.setItem('theme', 'dark');
  Cookies.remove('token');
});

describe('Namespace Select', () => {
  test(
    'Namespace change error',
    async () => {
      counter = 0;
      await setup_extended(true);

      expect(await screen.findByLabelText('crd')).toBeInTheDocument();

      expect(await screen.findByText('awesome-view')).toBeInTheDocument();

      const ns = screen.getByText('all namespaces');
      userEvent.click(ns);

      const ns_liqo = await screen.findByText('liqo');
      const ns_default = await screen.findAllByText('default');

      expect(ns_liqo).toBeInTheDocument();
      expect(await screen.findByText('test')).toBeInTheDocument();
      expect(ns_default[1]).toBeInTheDocument();

      await act(async () => {
        counter++;
        fireEvent.mouseOver(ns_liqo);
        fireEvent.click(ns_liqo);

        await new Promise(r => setTimeout(r, 1000));
      });

      expect(await screen.queryByText('awesome-view')).toBeInTheDocument();
    },
    testTimeout
  );

  test(
    'Namespace change resource displayed',
    async () => {
      await setup_extended();

      expect(await screen.findByLabelText('crd')).toBeInTheDocument();

      expect(await screen.findByText('awesome-view')).toBeInTheDocument();

      const ns = screen.getByText('all namespaces');
      userEvent.click(ns);

      const ns_liqo = await screen.findByText('liqo');
      const ns_default = await screen.findAllByText('default');

      expect(ns_liqo).toBeInTheDocument();
      expect(await screen.findByText('test')).toBeInTheDocument();
      expect(ns_default[1]).toBeInTheDocument();

      await act(async () => {
        fireEvent.mouseOver(ns_liqo);
        fireEvent.click(ns_liqo);

        await new Promise(r => setTimeout(r, 1000));
      });

      expect(await screen.queryByText('awesome-view')).not.toBeInTheDocument();

      let view = ViewMockResponse.items[0];
      view.metadata.name = 'test-view-2';

      window.api.customViews.current.push(view);

      window.api.apiManager.current.sendAddedSignal('views', view);
    },
    testTimeout
  );

  test(
    'Namespace starting from non default',
    async () => {
      fetch.mockResponse(req => {
        return mocks(req);
      });

      setToken();
      window.api = ApiInterface({ id_token: 'test' });
      window.api.namespace.current = 'liqo';

      render(
        <MemoryRouter>
          <NamespaceSelect />
        </MemoryRouter>
      );

      const ns = await screen.findByText('liqo');
      userEvent.click(ns);

      const ns_all = await screen.findByText('all namespaces');

      expect(ns_all).toBeInTheDocument();

      await act(async () => {
        fireEvent.mouseOver(ns_all);
        fireEvent.click(ns_all);

        await new Promise(r => setTimeout(r, 1000));
      });

      expect(window.api.namespace.current).toBeNull();
    },
    testTimeout
  );

  test(
    'Namespace listing error',
    async () => {
      fetch.mockResponse(req => {
        return mocks(req, true);
      });

      setup_login();

      /** Input mock password */
      const tokenInput = screen.getByLabelText('lab');
      await userEvent.type(tokenInput, token);

      /** Click on login button */
      const submitButton = screen.getByRole('button');

      userEvent.click(submitButton);
    },
    testTimeout
  );

  test(
    'Namespace from a token namespace',
    async () => {
      fetch.mockResponse(req => {
        return mocks(req);
      });

      const token =
        'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJUdHFQUThaZ2NjcURqQXJ0RG1WX0FQS0lLSFJBaEVQSm9RSmxvOVZIQ3Q4In0.eyJqdGkiOiIxNmI4NjliMi0xMzFkLTQwNjktYjcyMC01YzdkOGI3MzA4MDMiLCJleHAiOjE2MDU5NzY3ODUsIm5iZiI6MCwiaWF0IjoxNjA1OTY5NTg1LCJpc3MiOiJodHRwczovL2F1dGguY3Jvd25sYWJzLnBvbGl0by5pdC9hdXRoL3JlYWxtcy9jcm93bmxhYnMiLCJhdWQiOiJrOHMiLCJzdWIiOiI5NjdjMWM2NC0yNmQ3LTRjY2ItOWI4Yi0wMjMzNDcxNDdkN2EiLCJ0eXAiOiJJRCIsImF6cCI6Ims4cyIsImF1dGhfdGltZSI6MTYwNTk2OTU4NCwic2Vzc2lvbl9zdGF0ZSI6Ijc4ZjcxYjYxLTM3MjUtNDg0ZC1hMmVhLWFiMWUxNDhjYmNiOSIsImFjciI6IjEiLCJ1c2VyX2VtYWlsIjoiYWxlc3NhbmRyby5uYXBvbGV0YW5vMTk5NUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkFsZXNzYW5kcm8gTmFwb2xldGFubyIsIm5hbWVzcGFjZSI6WyJ0ZW5hbnQtYWxlc3NhbmRyby1uYXBvbGV0YW5vIl0sImdyb3VwcyI6WyJrdWJlcm5ldGVzOmNvdXJzZS1zaWQtYWRtaW4iLCJrdWJlcm5ldGVzOmNvdXJzZS1zaWQiLCJrdWJlcm5ldGVzOmFkbWluIl0sInByZWZlcnJlZF91c2VybmFtZSI6ImFsZXNzYW5kcm8ubmFwb2xldGFubyIsIm1lbWJlcnNoaXAiOlsiL2NvdXJzZS1zaWQiLCIvY291cnNlLXNpZC1hZG1pbiJdLCJnaXZlbl9uYW1lIjoiQWxlc3NhbmRybyIsImZhbWlseV9uYW1lIjoiTmFwb2xldGFubyIsImVtYWlsIjoiYWxlc3NhbmRyby5uYXBvbGV0YW5vMTk5NUBnbWFpbC5jb20iLCJncmFmYW5hX3JvbGUiOlsiY291cnNlLXNpZC1hZG1pbiIsImNvdXJzZS1zaWQiLCJhZG1pbiJdfQ.gKlXMHARf2jIQgWET8gnI5itSKupJkNJf5EIpH7tLR09cL50vt0USz9nX0YJrU9n-NI9SEJp2V2wpvJHaL8e6Nk2k8tQ_';

      Cookies.set('token', token);
      window.api = ApiInterface({ id_token: 'test' });
      window.api.namespace.current = 'liqo';

      render(
        <MemoryRouter>
          <NamespaceSelect />
        </MemoryRouter>
      );
    },
    testTimeout
  );
});
