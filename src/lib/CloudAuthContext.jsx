import { createContext, useContext } from 'react';

export const CloudAuthContext = createContext(null);

export function useCloudAuth() {
  return useContext(CloudAuthContext);
}
