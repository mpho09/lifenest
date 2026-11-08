import { fireEvent, render, screen } from '@testing-library/react-native';

import { ConfirmModal } from '../../components/ConfirmModal';

const base = {
  visible: true,
  title: 'Delete this document?',
  text: 'This can’t be undone.',
  confirmLabel: 'Delete',
};

describe('ConfirmModal (T-C-8)', () => {
  it('T-C-8 shows the title and text; the danger button calls confirm', async () => {
    const onConfirm = jest.fn();
    await render(<ConfirmModal {...base} onConfirm={onConfirm} onCancel={() => {}} />);
    expect(screen.getByText(base.title)).toBeOnTheScreen();
    expect(screen.getByText(base.text)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('T-C-8 Cancel calls cancel', async () => {
    const onCancel = jest.fn();
    await render(<ConfirmModal {...base} onConfirm={() => {}} onCancel={onCancel} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('T-C-8 with typeToConfirm="DELETE" the danger button stays disabled until DELETE is typed', async () => {
    const onConfirm = jest.fn();
    await render(
      <ConfirmModal
        {...base}
        typeToConfirm="DELETE"
        typeToConfirmLabel="Type DELETE to confirm"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    const danger = () => screen.getByRole('button', { name: 'Delete' });
    expect(danger()).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'delete');
    expect(danger()).toBeDisabled();
    await fireEvent.press(danger());
    expect(onConfirm).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(danger()).toBeEnabled();
    await fireEvent.press(danger());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('T-C-8 renders nothing when not visible', async () => {
    await render(<ConfirmModal {...base} visible={false} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText(base.title)).toBeNull();
  });
});
