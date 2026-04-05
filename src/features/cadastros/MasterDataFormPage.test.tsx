import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { z } from 'zod';
import { MasterDataFormPage } from './MasterDataFormPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

describe('MasterDataFormPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('submits creation payloads', async () => {
    const create = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/pessoas/nova']}>
        <Routes>
          <Route
            path="/pessoas/nova"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [{ name: 'nome', label: 'Nome', kind: 'text' }],
                  schema: z.object({ nome: z.string().min(1) }),
                  defaultFilters: {},
                  defaultValues: { nome: '' },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByRole('textbox'), 'Pessoa Exemplo');
    await userEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ nome: 'Pessoa Exemplo' }));
    expect(navigateMock).toHaveBeenCalledWith('/pessoas');
  }, 10000);

  it('applies server validation errors to the form', async () => {
    const create = vi.fn().mockRejectedValue(
      new AxiosError('Bad request', '400', undefined, undefined, {
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Erro',
          errors: {
            Nome: ['Nome obrigatorio.']
          },
          traceId: 'trace-id'
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never
      })
    );

    render(
      <MemoryRouter initialEntries={['/pessoas/nova']}>
        <Routes>
          <Route
            path="/pessoas/nova"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [{ name: 'nome', label: 'Nome', kind: 'text' }],
                  schema: z.object({ nome: z.string().min(1) }),
                  defaultFilters: {},
                  defaultValues: { nome: 'Pessoa Exemplo' },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), ' ');
    await userEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Pessoa Exemplo');
    await userEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    expect(await screen.findByText('Nome obrigatorio.')).toBeInTheDocument();
  }, 10000);

  it('loads detail in edit mode and submits updates', async () => {
    const detail = vi.fn().mockResolvedValue({ nome: 'Pessoa existente' });
    const update = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/pessoas/1']}>
        <Routes>
          <Route
            path="/pessoas/:id"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [{ name: 'nome', label: 'Nome', kind: 'text' }],
                  schema: z.object({ nome: z.string().min(1) }),
                  defaultFilters: {},
                  defaultValues: { nome: '' },
                  list: vi.fn(),
                  detail,
                  create: vi.fn(),
                  update,
                  toFormValues: (value) => value
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Pessoa existente')).toBeInTheDocument();

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Pessoa atualizada');
    await userEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(update).toHaveBeenCalledWith('1', { nome: 'Pessoa atualizada' }));
  });
});
