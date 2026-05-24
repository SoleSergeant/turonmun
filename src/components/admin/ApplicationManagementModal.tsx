import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  School, 
  Calendar, 
  Upload, 
  Award, 
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  FileText,
  User,
  MessageSquare,
  Heart,
  Hash,
  Cake,
  BadgeCheck
} from 'lucide-react';

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
  fee_agreement?: string;
  discount_eligibility?: string;
  final_confirmation?: boolean;
  has_ielts: boolean;
  has_sat: boolean;
  ielts_score?: number;
  sat_score?: number;
  payment_amount?: number;
  dietary_restrictions?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  application_id?: string;
  photo_url?: string;
  certificate_url?: string;
  ielts_certificate_url?: string;
  sat_certificate_url?: string;
  emergency_contact_relation?: string;
  notes?: string;
}

interface ApplicationManagementModalProps {
  application: Application;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
  onDelete: (id: string) => void;
}

const ApplicationManagementModal: React.FC<ApplicationManagementModalProps> = ({ 
  application, 
  onClose,
  onUpdateStatus,
  onDelete
}) => {
  // ── Helpers ──────────────────────────────────────────────
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default:         return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={18} className="text-green-600" />;
      case 'rejected': return <XCircle size={18} className="text-red-600" />;
      default:         return <Clock size={18} className="text-yellow-600" />;
    }
  };

  // ── Parse notes for extra data ──────────────────────────
  const getFromNotes = (label: string): string | null => {
    if (!application.notes) return null;
    const regex = new RegExp(`${label}:?\\s*(.+)`, 'i');
    const match = application.notes.match(regex);
    if (!match) return null;
    const val = match[1].trim();
    return (val && val !== 'N/A' && val !== 'None' && val !== 'Not Specified' && val !== 'null') ? val : null;
  };

  const getUrlFromNotes = (label: string): string | null => {
    if (!application.notes) return null;
    const regex = new RegExp(`${label}:?\\s*(https?:\\/\\/[^\\s\\n\\r]+)`, 'i');
    const match = application.notes.match(regex);
    return match ? match[1].trim() : null;
  };

  // Resolved values
  const photoUrl = application.photo_url || getUrlFromNotes('Photo URL');
  const ieltsUrl = application.ielts_certificate_url || getUrlFromNotes('IELTS URL');
  const satUrl   = application.sat_certificate_url || getUrlFromNotes('SAT URL');
  const certUrl  = application.certificate_url;
  const hasFiles = photoUrl || ieltsUrl || satUrl || certUrl;

  const gender          = getFromNotes('Gender');
  const grade           = getFromNotes('Grade');
  const medicalCond     = getFromNotes('Medical Conditions');
  const previousMuns    = application.previous_muns || getFromNotes('Previous MUNs');
  const telegram        = application.telegram_username || application.emergency_contact_relation || getFromNotes('Telegram');
  const phone           = application.phone || getFromNotes('Phone');
  const dob             = application.date_of_birth || getFromNotes('Date of Birth');
  const ieltsScore      = application.ielts_score ?? getFromNotes('IELTS Score');
  const satScore        = application.sat_score ?? getFromNotes('SAT Score');

  // ── Detail row component ───────────────────────────────
  const DetailRow = ({ icon: Icon, label, value, color = 'text-gray-400', valueClass = '' }: {
    icon: any; label: string; value: React.ReactNode; color?: string; valueClass?: string;
  }) => (
    <div className="flex items-start py-2.5 border-b border-gray-100 last:border-0">
      <Icon size={15} className={`mr-3 mt-0.5 flex-shrink-0 ${color}`} />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm text-gray-800 flex-1 ${valueClass}`}>{value}</span>
    </div>
  );

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-6xl mx-auto">
        
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center space-x-4">
            {photoUrl ? (
              <img src={photoUrl} alt={application.full_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <User size={24} className="text-white/70" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{application.full_name}</h2>
              <p className="text-slate-300 text-sm">{application.institution} · {application.country}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(application.status)}`}>
              {getStatusIcon(application.status)}
              <span className="capitalize">{application.status}</span>
            </div>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>
        
        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ════════ LEFT COLUMN ════════ */}
            <div className="space-y-5">

              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-600" /> Personal Information
                </h3>
                <div className="divide-y divide-gray-100">
                  <DetailRow icon={Mail} label="Email" value={
                    <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">{application.email}</a>
                  } color="text-blue-400" />

                  {telegram && (
                    <DetailRow icon={MessageSquare} label="Telegram" value={telegram} color="text-sky-400" />
                  )}

                  {phone && (
                    <DetailRow icon={Phone} label="Phone" value={phone} color="text-green-400" />
                  )}

                  <DetailRow icon={MapPin} label="Location" value={application.country} color="text-red-400" />

                  <DetailRow icon={School} label="Institution" value={application.institution} color="text-purple-400" />

                  {dob && (
                    <DetailRow icon={Cake} label="Birth Date" value={
                      <span>{formatDate(dob)} <span className="text-gray-400 ml-1">({calculateAge(dob)} years)</span></span>
                    } color="text-pink-400" />
                  )}

                  {gender && (
                    <DetailRow icon={User} label="Gender" value={gender} color="text-indigo-400" />
                  )}

                  {grade && (
                    <DetailRow icon={Hash} label="Grade" value={grade} color="text-amber-400" />
                  )}
                </div>
              </div>

              {/* Experience & Background */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award size={16} className="text-amber-600" /> Experience & Background
                </h3>
                <div className="divide-y divide-gray-100">
                  <DetailRow icon={Award} label="MUN Exp." value={application.experience || 'None'} color="text-amber-400" />

                  {previousMuns && (
                    <DetailRow icon={FileText} label="Past MUNs" value={previousMuns} color="text-orange-400" />
                  )}

                  {application.portfolio_link && (
                    <DetailRow icon={ExternalLink} label="Portfolio" value={
                      <a href={application.portfolio_link} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1">
                        View Profile <ExternalLink size={12} />
                      </a>
                    } color="text-blue-400" />
                  )}
                </div>
              </div>

              {/* Health & Emergency */}
              {(medicalCond || application.dietary_restrictions) && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Heart size={16} className="text-red-500" /> Health & Emergency
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {medicalCond && (
                      <DetailRow icon={Heart} label="Medical" value={medicalCond} color="text-red-400" />
                    )}
                    {application.dietary_restrictions && (
                      <DetailRow icon={Heart} label="Dietary" value={application.dietary_restrictions} color="text-orange-400" />
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" /> Application Timeline
                </h3>
                <div className="divide-y divide-gray-100">
                  <DetailRow icon={Calendar} label="Submitted" value={formatDate(application.created_at)} color="text-gray-400" />
                  <DetailRow icon={BadgeCheck} label="Status" value={
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  } color="text-gray-400" />
                </div>
                {application.application_id && (
                  <p className="text-[10px] text-gray-400 mt-3 font-mono">ID: {application.id}</p>
                )}
              </div>
            </div>

            {/* ════════ RIGHT COLUMN ════════ */}
            <div className="space-y-5">

              {/* Committee Preferences */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users size={16} className="text-green-600" /> Committee Preferences
                </h3>

                <div className="space-y-2 mb-4">
                  {[
                    { n: '1st', val: application.committee_preference1, color: 'bg-green-50 border-green-200 text-green-800' },
                    { n: '2nd', val: application.committee_preference2, color: 'bg-blue-50 border-blue-200 text-blue-800' },
                    { n: '3rd', val: application.committee_preference3, color: 'bg-purple-50 border-purple-200 text-purple-800' },
                  ].map(c => (
                    <div key={c.n} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${c.color}`}>
                      <span className="text-xs font-bold w-8">{c.n}</span>
                      <span className="text-sm font-medium">{c.val}</span>
                    </div>
                  ))}
                </div>

                {application.motivation && application.motivation !== 'Not provided' && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivation</span>
                    <p className="text-sm text-gray-700 mt-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed max-h-40 overflow-y-auto">
                      {application.motivation}
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Files */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Upload size={16} className="text-purple-600" /> Uploaded Files & Scores
                </h3>

                {hasFiles ? (
                  <div className="space-y-3">
                    {/* Photo */}
                    {photoUrl && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <img src={photoUrl} alt="Applicant"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-gray-700">Applicant Photo</span>
                          <a href={photoUrl} target="_blank" rel="noopener noreferrer"
                            className="block text-xs text-purple-600 hover:underline mt-0.5 flex items-center gap-1">
                            View Full Size <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* IELTS */}
                    {ieltsUrl && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-green-600" />
                            <span className="text-sm font-semibold text-green-800">IELTS Certificate</span>
                          </div>
                          {ieltsScore && (
                            <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                              Score: {ieltsScore}
                            </span>
                          )}
                        </div>
                        <a href={ieltsUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-green-700 hover:underline font-medium">
                          <ExternalLink size={12} /> Open Document
                        </a>
                      </div>
                    )}

                    {/* SAT */}
                    {satUrl && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">SAT Certificate</span>
                          </div>
                          {satScore && (
                            <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              Score: {satScore}
                            </span>
                          )}
                        </div>
                        <a href={satUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline font-medium">
                          <ExternalLink size={12} /> Open Document
                        </a>
                      </div>
                    )}

                    {/* Legacy cert */}
                    {certUrl && !ieltsUrl && !satUrl && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-600" />
                          <span className="text-sm font-semibold text-gray-800">Certificate</span>
                        </div>
                        <a href={certUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-gray-700 hover:underline font-medium">
                          <ExternalLink size={12} /> Open Document
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No files uploaded</p>
                )}

                {/* Discount tags */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Discounts:</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${application.has_ielts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    IELTS {application.has_ielts ? '✓' : '✗'}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${application.has_sat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    SAT {application.has_sat ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              {/* Fee & Payment */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-600" /> Fee & Payment
                </h3>
                <div className="divide-y divide-gray-100">
                  {application.fee_agreement && (
                    <DetailRow icon={CheckCircle} label="Fee Agreed" value={
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                        application.fee_agreement === 'Yes' ? 'bg-green-100 text-green-700'  : 'bg-red-100 text-red-700'
                      }`}>{application.fee_agreement}</span>
                    } color="text-green-400" />
                  )}

                  {application.payment_amount != null && (
                    <DetailRow icon={DollarSign} label="Amount" value={
                      <span className="font-semibold">{application.payment_amount.toLocaleString()} UZS</span>
                    } color="text-emerald-400" />
                  )}

                  {application.discount_eligibility && (
                    <DetailRow icon={Award} label="Discounts" value={application.discount_eligibility} color="text-amber-400" />
                  )}

                  <DetailRow icon={BadgeCheck} label="Confirmed" value={
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                      application.final_confirmation ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{application.final_confirmation ? 'Yes' : 'No'}</span>
                  } color="text-gray-400" />
                </div>
              </div>

              {/* Raw Notes (collapsed) */}
              {application.notes && (
                <details className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <summary className="px-5 py-3 cursor-pointer text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 select-none">
                    <FileText size={16} className="text-gray-400" /> Raw Notes
                  </summary>
                  <pre className="px-5 pb-4 text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {application.notes}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
        
        {/* ─── Action Footer ─── */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50/80 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Submitted {formatDate(application.created_at)} · <span className="font-mono">#{application.id.substring(0, 8)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus(application.id, 'approved')}
              disabled={application.status === 'approved'}
              className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                application.status === 'approved'
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
              }`}
            >
              <CheckCircle size={16} /> Approve
            </button>
            
            <button
              onClick={() => onUpdateStatus(application.id, 'rejected')}
              disabled={application.status === 'rejected'}
              className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                application.status === 'rejected'
                  ? 'bg-red-100 text-red-700 cursor-default'
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md'
              }`}
            >
              <XCircle size={16} /> Reject
            </button>
            
            <button
              onClick={() => onDelete(application.id)}
              className="px-5 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationManagementModal;