
import { Book, FileText, Video, BookOpen, Scale, PenLine } from 'lucide-react';

export const categories = [
  { value: 'handbook',        label: 'Delegate Handbook',          icon: BookOpen },
  { value: 'rop',             label: 'Rules of Procedure (ROP)',   icon: Scale    },
  { value: 'position_paper',  label: 'Position Paper Template',    icon: PenLine  },
  { value: 'Delegate Guides', label: 'Delegate Guides',            icon: Book     },
  { value: 'Committee Materials', label: 'Committee Materials',    icon: FileText },
  { value: 'Video Tutorials', label: 'Video Tutorials',            icon: Video    },
];

export const getCategoryIcon = (categoryValue: string) => {
  const category = categories.find(c => c.value === categoryValue);
  return category ? category.icon : Book;
};
