
export interface Committee {
  id: string;
  name: string;
  abbreviation?: string;
  description: string;
  topics: string[];
  image_url?: string;
  chair?: string;
  co_chair?: string;
  created_at: string;
}

export interface CommitteeFormData {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  topics: string[];
  image_url: string;
  chair: string;
  co_chair: string;
}

export const initialFormState: CommitteeFormData = {
  id: '',
  name: '',
  abbreviation: '',
  description: '',
  topics: [''],
  image_url: '',
  chair: '',
  co_chair: '',
};
