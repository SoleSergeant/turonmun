export interface Resource {
  id: string;
  category: string;
  title: string;
  description: string;
  link: string; // Mapping to file_url in DB
  created_at: string;
  committee_id?: string | null;
  is_public?: boolean;
}
