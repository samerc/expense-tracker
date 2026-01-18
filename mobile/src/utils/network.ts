import * as Network from 'expo-network';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: Network.NetworkStateType;
}

// Get current network state
export const getNetworkState = async (): Promise<NetworkState> => {
  const state = await Network.getNetworkStateAsync();

  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? false,
    type: state.type ?? Network.NetworkStateType.UNKNOWN,
  };
};

// Check if device is online and can reach internet
export const isOnline = async (): Promise<boolean> => {
  const state = await getNetworkState();
  return state.isConnected && state.isInternetReachable;
};

// Check if on WiFi
export const isOnWifi = async (): Promise<boolean> => {
  const state = await getNetworkState();
  return state.type === Network.NetworkStateType.WIFI;
};

// Check if on cellular
export const isOnCellular = async (): Promise<boolean> => {
  const state = await getNetworkState();
  return state.type === Network.NetworkStateType.CELLULAR;
};

// Network state types for display
export const getNetworkTypeLabel = (type: Network.NetworkStateType): string => {
  switch (type) {
    case Network.NetworkStateType.WIFI:
      return 'WiFi';
    case Network.NetworkStateType.CELLULAR:
      return 'Cellular';
    case Network.NetworkStateType.BLUETOOTH:
      return 'Bluetooth';
    case Network.NetworkStateType.ETHERNET:
      return 'Ethernet';
    case Network.NetworkStateType.VPN:
      return 'VPN';
    case Network.NetworkStateType.OTHER:
      return 'Other';
    case Network.NetworkStateType.NONE:
      return 'None';
    default:
      return 'Unknown';
  }
};
