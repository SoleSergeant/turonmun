import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook that scrolls to the top of the page on route change.
 * This improves UX and helps with SEO by ensuring crawlers see all content.
 */
const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo(0, 0);
    
    // Send a custom event that the route has changed
    // This can be used by other components if needed
    window.dispatchEvent(new CustomEvent('routeChange', { detail: { path: pathname } }));
  }, [pathname]);
};

export default useScrollToTop;
