import { useNetInfo } from '@react-native-community/netinfo';
import { render, screen } from '@testing-library/react-native';

import { OfflineBanner } from '../../components/OfflineBanner';

const mockedUseNetInfo = useNetInfo as jest.Mock;
const OFFLINE = 'You’re offline. Changes will not be saved.';

describe('OfflineBanner (T-C-5)', () => {
  it('T-C-5 is visible with the exact PRD text when offline', async () => {
    mockedUseNetInfo.mockReturnValue({ isConnected: false, isInternetReachable: false });
    await render(<OfflineBanner />);
    expect(screen.getByText(OFFLINE)).toBeOnTheScreen();
  });

  it('T-C-5 is hidden when online', async () => {
    mockedUseNetInfo.mockReturnValue({ isConnected: true, isInternetReachable: true });
    await render(<OfflineBanner />);
    expect(screen.queryByText(OFFLINE)).toBeNull();
  });

  it('T-C-5 is hidden while the network state is still unknown', async () => {
    mockedUseNetInfo.mockReturnValue({ isConnected: null, isInternetReachable: null });
    await render(<OfflineBanner />);
    expect(screen.queryByText(OFFLINE)).toBeNull();
  });
});
