
import { Book, FileText, Video } from 'lucide-react';

export const categories = [
  { value: 'Delegate Guides', label: 'Delegate Guides', icon: Book },
  { value: 'Committee Materials', label: 'Committee Materials', icon: FileText },
  { value: 'Video Tutorials', label: 'Video Tutorials', icon: Video },
];

export const getCategoryIcon = (categoryValue: string) => {
  const category = categories.find(c => c.value === categoryValue);
  return category ? category.icon : Book;
};
