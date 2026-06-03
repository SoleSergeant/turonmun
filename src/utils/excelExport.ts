import * as XLSX from 'xlsx';

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
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  application_id?: string;
  photo_url?: string;
  certificate_url?: string;
  ielts_certificate_url?: string;
  sat_certificate_url?: string;
}

export const exportApplicationsToExcel = (applications: Application[], fileName: string = 'TuronMUN_Applications') => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data with headers
  const headers = [
    'Application ID',
    'Full Name',
    'Email',
    'Telegram',
    'Institution',
    'Date of Birth',
    'Country',
    'Phone',
    'Experience Level',
    'Previous MUNs',
    'Portfolio Link',
    'Unique Trait',
    'Issue Interest',
    'Type 1 Prompt',
    'Type 1 Response',
    'Type 2 Prompt', 
    'Type 2 Response',
    'Committee Pref 1',
    'Committee Pref 2',
    'Committee Pref 3',
    'Motivation',
    'Fee Agreement',
    'Discount Eligibility',
    'Final Confirmation',
    'Has IELTS',
    'Has SAT',
    'Status',
    'Photo URL',
    'Certificate URL',
    'IELTS Cert URL',
    'SAT Cert URL',
    'Application Date'
  ];

  // Transform applications data
  const data = applications.map(app => [
    app.application_id || app.id,
    app.full_name || '',
    app.email || '',
    app.telegram_username || '',
    app.institution || '',
    app.date_of_birth || '',
    app.country || '',
    app.phone || '',
    app.experience || '',
    app.previous_muns || '',
    app.portfolio_link || '',
    app.unique_delegate_trait || '',
    app.issue_interest || '',
    app.type1_selected_prompt || '',
    app.type1_insight_response || '',
    app.type2_selected_prompt || '',
    app.type2_political_response || '',
    app.committee_preference1 || '',
    app.committee_preference2 || '',
    app.committee_preference3 || '',
    app.motivation || '',
    app.fee_agreement || '',
    app.discount_eligibility || '',
    app.final_confirmation ? 'Yes' : 'No',
    app.has_ielts ? 'Yes' : 'No',
    app.has_sat ? 'Yes' : 'No',
    app.status || 'pending',
    app.photo_url || '',
    app.certificate_url || '',
    app.ielts_certificate_url || '',
    app.sat_certificate_url || '',
    new Date(app.created_at).toLocaleDateString()
  ]);

  // Combine headers and data
  const wsData = [headers, ...data];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Define column widths for better readability
  const colWidths = [
    { wch: 15 }, // Application ID
    { wch: 20 }, // Full Name
    { wch: 25 }, // Email
    { wch: 15 }, // Telegram
    { wch: 25 }, // Institution
    { wch: 12 }, // Date of Birth
    { wch: 15 }, // Country
    { wch: 15 }, // Phone
    { wch: 12 }, // Experience
    { wch: 20 }, // Previous MUNs
    { wch: 25 }, // Portfolio Link
    { wch: 30 }, // Unique Trait
    { wch: 30 }, // Issue Interest
    { wch: 25 }, // Type 1 Prompt
    { wch: 50 }, // Type 1 Response
    { wch: 25 }, // Type 2 Prompt
    { wch: 50 }, // Type 2 Response
    { wch: 18 }, // Committee Pref 1
    { wch: 18 }, // Committee Pref 2
    { wch: 18 }, // Committee Pref 3
    { wch: 40 }, // Motivation
    { wch: 15 }, // Fee Agreement
    { wch: 20 }, // Discount Eligibility
    { wch: 12 }, // Final Confirmation
    { wch: 10 }, // Has IELTS
    { wch: 10 }, // Has SAT
    { wch: 12 }, // Status
    { wch: 30 }, // Photo URL
    { wch: 30 }, // Certificate URL
    { wch: 30 }, // IELTS Cert URL
    { wch: 30 }, // SAT Cert URL
    { wch: 15 }  // Application Date
  ];

  ws['!cols'] = colWidths;

  // Apply styling to header row
  const headerStyle = {
    fill: { fgColor: { rgb: "1F2937" } }, // Dark gray background
    font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 }, // White, bold text
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };

  // Apply styles to header cells (A1 to AF1)
  for (let col = 0; col < headers.length; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = headerStyle;
  }

  // Apply styling based on status
  for (let row = 1; row <= applications.length; row++) {
    const app = applications[row - 1];
    const statusCol = 26; // Status column (AA)
    const statusCellAddress = XLSX.utils.encode_cell({ r: row, c: statusCol });
    
    if (ws[statusCellAddress]) {
      let cellStyle: any = {
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } }
        }
      };

      // Color code based on status
      switch (app.status) {
        case 'approved':
          cellStyle.fill = { fgColor: { rgb: "DCFCE7" } }; // Light green
          cellStyle.font = { color: { rgb: "166534" }, bold: true }; // Dark green text
          break;
        case 'rejected':
          cellStyle.fill = { fgColor: { rgb: "FEE2E2" } }; // Light red
          cellStyle.font = { color: { rgb: "DC2626" }, bold: true }; // Dark red text
          break;
        default: // pending
          cellStyle.fill = { fgColor: { rgb: "FEF3C7" } }; // Light yellow
          cellStyle.font = { color: { rgb: "D97706" }, bold: true }; // Dark yellow text
      }
      
      ws[statusCellAddress].s = cellStyle;
    }

    // Apply alternating row colors for better readability
    const rowStyle = {
      fill: { fgColor: { rgb: row % 2 === 0 ? "F9FAFB" : "FFFFFF" } }, // Alternating light gray and white
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    };

    // Apply row styling to all cells except status (which has custom styling)
    for (let col = 0; col < headers.length; col++) {
      if (col === statusCol) continue; // Skip status column
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = rowStyle;
      }
    }
  }

  // Set row height for header
  ws['!rows'] = [{ hpt: 25 }]; // Header row height

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Applications');

  // Create summary sheet
  const summaryData = createSummarySheet(applications);
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Style summary sheet
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
  
  // Header styling for summary
  const summaryHeaderCells = ['A1', 'B1'];
  summaryHeaderCells.forEach(cellAddress => {
    if (summaryWs[cellAddress]) {
      summaryWs[cellAddress].s = headerStyle;
    }
  });

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Generate filename with current date
  const currentDate = new Date().toISOString().split('T')[0];
  const finalFileName = `${fileName}_${currentDate}.xlsx`;

  // Write file
  XLSX.writeFile(wb, finalFileName);
  
  return finalFileName;
};

const createSummarySheet = (applications: Application[]) => {
  const totalApplications = applications.length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  
  const countries = [...new Set(applications.map(app => app.country))];
  const institutions = [...new Set(applications.map(app => app.institution))];
  
  const ieltsCount = applications.filter(app => app.has_ielts).length;
  const satCount = applications.filter(app => app.has_sat).length;

  return [
    ['Metric', 'Value'],
    ['Total Applications', totalApplications],
    ['Approved Applications', approvedCount],
    ['Rejected Applications', rejectedCount],
    ['Pending Applications', pendingCount],
    ['Approval Rate', `${totalApplications > 0 ? ((approvedCount / totalApplications) * 100).toFixed(1) : 0}%`],
    ['Countries Represented', countries.length],
    ['Institutions Represented', institutions.length],
    ['Applicants with IELTS', ieltsCount],
    ['Applicants with SAT', satCount],
    ['Export Date', new Date().toLocaleDateString()],
    ['Export Time', new Date().toLocaleTimeString()]
  ];
}; 