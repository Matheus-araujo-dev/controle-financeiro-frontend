import { applyServerValidationErrors } from './applyServerValidationErrors';

describe('applyServerValidationErrors', () => {
  it('maps the first message of each field to the form setter', () => {
    const setFieldError = vi.fn();

    applyServerValidationErrors(
      {
        nome: ['Nome obrigatório.', 'Não deve aparecer.'],
        email: ['Email inválido.']
      },
      setFieldError
    );

    expect(setFieldError).toHaveBeenNthCalledWith(1, 'nome', 'Nome obrigatório.');
    expect(setFieldError).toHaveBeenNthCalledWith(2, 'email', 'Email inválido.');
  });

  it('ignores fields without messages', () => {
    const setFieldError = vi.fn();

    applyServerValidationErrors(
      {
        nome: []
      },
      setFieldError
    );

    expect(setFieldError).not.toHaveBeenCalled();
  });

  it('normalizes pascal case field names from the backend', () => {
    const setFieldError = vi.fn();

    applyServerValidationErrors(
      {
        Nome: ['Nome obrigatório.']
      },
      setFieldError
    );

    expect(setFieldError).toHaveBeenCalledWith('nome', 'Nome obrigatório.');
  });
});
