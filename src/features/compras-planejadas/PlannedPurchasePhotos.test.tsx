import { fireEvent, render, screen } from '@testing-library/react';
import { PlannedPurchasePhotos } from './PlannedPurchasePhotos';

it('abre o seletor de arquivos pelo botão em português', () => {
  render(<PlannedPurchasePhotos files={[]} onChange={vi.fn()} />);
  const click = vi.spyOn(screen.getByLabelText('Fotos do produto'), 'click');
  fireEvent.click(screen.getByRole('button', { name: 'Selecionar fotos' }));
  expect(click).toHaveBeenCalledOnce();
});

it.each([
  new File(['x'], 'doc.pdf', { type: 'application/pdf' }),
  new File([], 'empty.png', { type: 'image/png' }),
  new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
])('recusa foto inválida sem alterar seleção', file => {
  const onChange = vi.fn();
  render(<PlannedPurchasePhotos files={[]} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Fotos do produto'), { target: { files: [file] } });
  expect(screen.getByRole('alert')).toHaveTextContent(/até 10 MB/);
  expect(onChange).not.toHaveBeenCalled();
});
it('permite remover foto selecionada antes do envio', () => {
  const onChange = vi.fn();
  render(<PlannedPurchasePhotos files={[new File(['x'], 'mouse.png', { type: 'image/png' })]} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: 'Remover foto mouse.png' }));
  expect(onChange).toHaveBeenCalledWith([]);
});
