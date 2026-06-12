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
        message: 'Um ou mais campos são inválidos.',
        errors: {
          nome: ['Nome obrigatório.']
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
    expect(getApiErrorMessage(createAxiosError())).toBe('Um ou mais campos são inválidos.');
  });

  it('returns the original error message for non-axios Error instances', () => {
    expect(getApiErrorMessage(new Error('Falha local.'))).toBe('Falha local.');
  });

  it('returns a safe fallback for non-axios errors', () => {
    expect(getApiErrorMessage('boom')).toBe('Não foi possível concluir a solicitação.');
  });
});

describe('getApiFieldErrors', () => {
  it('returns the field dictionary from the backend error contract', () => {
    expect(getApiFieldErrors(createAxiosError())).toEqual({
      nome: ['Nome obrigatório.']
    });
  });

  it('returns an empty dictionary when the axios error has no contract payload', () => {
    expect(getApiFieldErrors(new AxiosError('Network Error'))).toEqual({});
  });
});
