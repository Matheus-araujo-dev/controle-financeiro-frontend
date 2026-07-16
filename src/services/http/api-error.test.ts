import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getApiErrorMessage, getApiFieldErrors, isFaturaIndisponivelError } from './api-error';

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

  it('returns an empty dictionary for non-axios errors', () => {
    expect(getApiFieldErrors(new Error('generic'))).toEqual({});
    expect(getApiFieldErrors('string error')).toEqual({});
  });
});

describe('isFaturaIndisponivelError', () => {
  it('returns true when error code is FATURA_INDISPONIVEL', () => {
    const error = new AxiosError(
      'Conflict',
      'ERR_BAD_REQUEST',
      { headers: {} } as InternalAxiosRequestConfig,
      undefined,
      {
        data: { code: 'FATURA_INDISPONIVEL', message: 'Fatura indisponível.', errors: {}, traceId: '' },
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: { headers: {} } as InternalAxiosRequestConfig
      }
    );
    expect(isFaturaIndisponivelError(error)).toBe(true);
  });

  it('returns false for errors with a different code', () => {
    expect(isFaturaIndisponivelError(createAxiosError())).toBe(false);
  });

  it('returns false for non-axios errors', () => {
    expect(isFaturaIndisponivelError(new Error('boom'))).toBe(false);
  });
});
