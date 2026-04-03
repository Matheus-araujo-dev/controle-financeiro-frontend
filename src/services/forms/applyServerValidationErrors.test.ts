import { applyServerValidationErrors } from './applyServerValidationErrors';

describe('applyServerValidationErrors', () => {
  it('maps the first message of each field to the form setter', () => {
    const setFieldError = vi.fn();

    applyServerValidationErrors(
      {
        nome: ['Nome obrigatorio.', 'Nao deve aparecer.'],
        email: ['Email invalido.']
      },
      setFieldError
    );

    expect(setFieldError).toHaveBeenNthCalledWith(1, 'nome', 'Nome obrigatorio.');
    expect(setFieldError).toHaveBeenNthCalledWith(2, 'email', 'Email invalido.');
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
});
