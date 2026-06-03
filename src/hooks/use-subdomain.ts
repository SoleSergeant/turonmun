import { useMemo } from 'react';

export type Subdomain = 'admin' | 'chair' | 'none';

export const useSubdomain = (): Subdomain => {
  return useMemo(() => {
    const hostname = window.location.hostname;
    
    // For local development, treat localhost as 'none' 
    // but allow forced subdomain via query param for testing
    const urlParams = new URLSearchParams(window.location.search);
    const forcedSubdomain = urlParams.get('subdomain');
    if (forcedSubdomain === 'admin' || forcedSubdomain === 'chair') {
      return forcedSubdomain as Subdomain;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'none';
    }

    if (hostname.startsWith('admin.')) {
      return 'admin';
    }
    
    if (hostname.startsWith('chair.')) {
      return 'chair';
    }

    return 'none';
  }, []);
};
