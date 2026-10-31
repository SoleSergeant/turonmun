import { downloadCsv, datedFilename } from '@/lib/csv';

interface Application {
  id: string;
  full_name: string;
  email: string;
  telegram_username?: string;
  institution: string;
  date_of_birth?: string;
  country: string;
  phone?: string;
  experience: string;
  previous_muns?: string;
  portfolio_link?: string;
  unique_delegate_trait?: string;
  issue_interest?: string;
  type1_selected_prompt?: string;
  type1_insight_response?: string;
  type2_selected_prompt?: string;
  type2_political_response?: string;
  committee_preference1: string;
  committee_preference2: string;
  committee_preference3: string;
  motivation?: string;
  fee_agreement?: boolean | null;
  discount_eligibility?: string;
  final_confirmation?: boolean;
  has_ielts: boolean;
  has_sat: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  created_at: string;
  application_id?: string;
  photo_url?: string;
  certificate_url?: string;
  ielts_certificate_url?: string;
  sat_certificate_url?: string;
}

const HEADERS = [
  'Application ID', 'Full Name', 'Email', 'Telegram', 'Institution', 'Date of Birth', 'Country', 'Phone',
  'Experience Level', 'Previous MUNs', 'Portfolio Link', 'Unique Trait', 'Issue Interest',
  'Type 1 Prompt', 'Type 1 Response', 'Type 2 Prompt', 'Type 2 Response',
  'Committee Pref 1', 'Committee Pref 2', 'Committee Pref 3', 'Motivation',
  'Fee Agreement', 'Discount Eligibility', 'Final Confirmation', 'Has IELTS', 'Has SAT', 'Status',
  'Photo URL', 'Certificate URL', 'IELTS Cert URL', 'SAT Cert URL', 'Application Date',
];

const yesNo = (v: boolean | null | undefined) => (v == null ? '' : v ? 'Yes' : 'No');

/** Downloads every application as a CSV (opens in Excel; Uzbek/Cyrillic names keep their letters). */
export const exportApplicationsToCsv = (applications: Application[], fileName = 'TuronMUN_Applications') => {
  const rows = applications.map(app => [
    app.application_id || app.id,
    app.full_name,
    app.email,
    app.telegram_username,
    app.institution,
    app.date_of_birth,
    app.country,
    app.phone,
    app.experience,
    app.previous_muns,
    app.portfolio_link,
    app.unique_delegate_trait,
    app.issue_interest,
    app.type1_selected_prompt,
    app.type1_insight_response,
    app.type2_selected_prompt,
    app.type2_political_response,
    app.committee_preference1,
    app.committee_preference2,
    app.committee_preference3,
    app.motivation,
    yesNo(app.fee_agreement),
    app.discount_eligibility,
    yesNo(app.final_confirmation),
    yesNo(app.has_ielts),
    yesNo(app.has_sat),
    app.status || 'pending',
    app.photo_url,
    app.certificate_url,
    app.ielts_certificate_url,
    app.sat_certificate_url,
    app.created_at?.slice(0, 10), // YYYY-MM-DD: unambiguous in any Excel locale
  ]);
  const name = datedFilename(fileName);
  downloadCsv(name, [HEADERS, ...rows]);
  return name;
};
