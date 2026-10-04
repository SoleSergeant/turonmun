import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, Users } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ByCommitteeView from '@/components/admin/allocation/ByCommitteeView';
import MatrixView from '@/components/admin/allocation/MatrixView';
import NotifySeatsButton from '@/components/admin/allocation/NotifySeatsButton';

const VIEWS = [
  { key: 'committee', label: 'By committee', icon: Users },
  { key: 'matrix', label: 'Country matrix', icon: LayoutGrid },
] as const;

/**
 * Seat allocation. Both views write through @/lib/allocation, so the same
 * rules apply whichever one is used.
 */
const Allocation = () => {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'matrix' ? 'matrix' : 'committee';

  const switchTo = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === 'committee') next.delete('view'); else next.set('view', key);
    setParams(next, { replace: true });
  };

  return (
    <AdminLayout title="Allocation">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Allocation</h2>
            <p className="text-gray-600">Seat paid delegates in committees and countries.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotifySeatsButton />
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              {VIEWS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => switchTo(key)}
                  className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    view === key ? 'bg-diplomatic-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === 'matrix' ? <MatrixView /> : <ByCommitteeView />}
      </div>
    </AdminLayout>
  );
};

export default Allocation;
