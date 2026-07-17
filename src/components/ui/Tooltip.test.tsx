import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  function setup(props: Omit<Parameters<typeof Tooltip>[0], 'children'>) {
    return render(
      <Tooltip {...props}>
        <button type="button">Hover me</button>
      </Tooltip>
    );
  }

  it('does not show tooltip initially', () => {
    setup({ content: 'Dica' });
    expect(screen.queryByText('Dica')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouseenter and hides on mouseleave', () => {
    const { container } = setup({ content: 'Dica de exemplo' });
    const wrapper = container.querySelector('span[style*="contents"]')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText('Dica de exemplo')).toBeInTheDocument();
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByText('Dica de exemplo')).not.toBeInTheDocument();
  });

  it('does not show tooltip when disabled', () => {
    const { container } = setup({ content: 'Dica', disabled: true });
    const wrapper = container.querySelector('span[style*="contents"]')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.queryByText('Dica')).not.toBeInTheDocument();
  });

  it('does not show tooltip when content is empty', () => {
    const { container } = setup({ content: '' });
    const wrapper = container.querySelector('span[style*="contents"]')!;
    fireEvent.mouseEnter(wrapper);
    // No fixed-position portal should be added when content is empty
    expect(document.querySelector('[style*="position: fixed"]')).toBeNull();
  });

  it('shows tooltip with side=top', () => {
    const { container } = setup({ content: 'Top', side: 'top' });
    const wrapper = container.querySelector('span[style*="contents"]')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText('Top')).toBeInTheDocument();
  });

  it('shows tooltip with side=bottom', () => {
    const { container } = setup({ content: 'Bottom', side: 'bottom' });
    const wrapper = container.querySelector('span[style*="contents"]')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText('Bottom')).toBeInTheDocument();
  });

  it('shows tooltip with side=left', () => {
    const { container } = setup({ content: 'Left', side: 'left' });
    const wrapper = container.querySelector('span[style*="contents"]')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText('Left')).toBeInTheDocument();
  });

  it('shows tooltip with side=right', () => {
    const { container } = setup({ content: 'Right', side: 'right' });
    const wrapper = container.querySelector('span[style*="contents"]')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText('Right')).toBeInTheDocument();
  });
});
