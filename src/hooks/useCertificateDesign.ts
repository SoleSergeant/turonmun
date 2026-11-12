import { useContent } from '@/content/store';
import type { CertificateDesign } from '@/lib/certificate';

/** Site content → Certificates, plus the logo and site address it needs. */
export function useCertificateDesign(): CertificateDesign {
  const cert = useContent('certificates');
  const general = useContent('general');
  const seo = useContent('seo');
  return { ...cert, logo_url: general.logo_url, site_url: seo.site_url || window.location.origin };
}
