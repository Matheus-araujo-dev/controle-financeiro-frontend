import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getApiErrorMessage, getApiFieldErrors } from './api-error';

function createAxiosError() {
  return new AxiosError(
    'Bad Request',
    'ERR_BAD_REQUEST',
    { headers: {}, method: 'get', url: '/pessoas' } as InternalAxiosRequestConfig,
    undefined,
    {
      data: {
        code: 'VALIDATION_ERROR',
        message: 'Um ou mais campos sao invalidos.',
        errors: {
          nome: ['Nome obrigatorio.']
        },
        traceId: 'trace-id'
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {}, method: 'get', url: '/pessoas' } as InternalAxiosRequestConfig
    }
  );
}

describe('getApiErrorMessage', () => {
  it('returns the backend message when the API returns the standard contract', () => {
    expect(getApiErrorMessage(createAxiosError())).toBe('Um ou mais campos sao invalidos.');
  });

  it('returns the original error message for non-axios Error instances', () => {
    expect(getApiErrorMessage(new Error('Falha local.'))).toBe('Falha local.');
  });

  it('returns a safe fallback for non-axios errors', () => {
    expect(getApiErrorMessage('boom')).toBe('Nao foi possivel concluir a solicitacao.');
  });
});

describe('getApiFieldErrors', () => {
  it('returns the field dictionary from the backend error contract', () => {
    expect(getApiFieldErrors(createAxiosError())).toEqual({
      nome: ['Nome obrigatorio.']
    });
  });

  it('returns an empty dictionary when the axios error has no contract payload', () => {
    expect(getApiFieldErrors(new AxiosError('Network Error'))).toEqual({});
  });
});
