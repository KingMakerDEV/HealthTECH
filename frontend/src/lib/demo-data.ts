export const demoPatientDashboard = {
  user: { id: 'p1', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'PATIENT' as const, patient_id: 'CN-2024-0847' },
  course: {
    id: 'c1',
    name: 'Post-Surgery Recovery Plan',
    doctor: 'Dr. Michael Chen',
    startDate: '2024-12-01',
    endDate: '2025-03-01',
    progress: 68,
    medications: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', taken: true },
      { name: 'Ibuprofen', dosage: '200mg', frequency: 'As needed', taken: false },
      { name: 'Vitamin D', dosage: '1000IU', frequency: 'Once daily', taken: true },
    ],
  },
  messages: [
    { id: 'm1', from: 'Dr. Chen', text: 'Your latest vitals look great. Keep up the recovery!', time: '2 hours ago', read: false },
    { id: 'm2', from: 'Dr. Chen', text: 'Please remember to upload your wound photo today.', time: '1 day ago', read: true },
  ],
  checkinQuestions: [
    'How are you feeling today?',
    'Rate your pain level (1-10)',
    'Did you take all medications?',
    'Any new symptoms?',
  ],
};

export const demoDoctorDashboard = {
  patients: [
    { id: 'p1', name: 'Sarah Johnson', patient_id: 'CN-2024-0847', condition: 'Post-Surgery Recovery', riskScore: 3, lastCheckin: '2 hours ago', status: 'stable' as const },
    { id: 'p2', name: 'James Wilson', patient_id: 'CN-2024-0623', condition: 'Diabetes Management', riskScore: 7, lastCheckin: '30 min ago', status: 'attention' as const },
    { id: 'p3', name: 'Emily Davis', patient_id: 'CN-2024-1102', condition: 'Cardiac Rehabilitation', riskScore: 5, lastCheckin: '1 day ago', status: 'stable' as const },
    { id: 'p4', name: 'Robert Brown', patient_id: 'CN-2024-0391', condition: 'COPD Management', riskScore: 9, lastCheckin: '5 min ago', status: 'critical' as const },
  ],
  patientDetail: {
    id: 'p2',
    name: 'James Wilson',
    patient_id: 'CN-2024-0623',
    age: 54,
    condition: 'Diabetes Management',
    riskScore: 7,
    metrics: {
      bloodSugar: [180, 165, 190, 175, 160, 155, 170],
      bloodPressure: [130, 128, 135, 132, 129, 131, 127],
      heartRate: [78, 82, 76, 80, 79, 81, 77],
      dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    medicationAdherence: 72,
    timeline: [
      { date: '2024-12-15', event: 'Blood sugar spike detected', type: 'warning' as const },
      { date: '2024-12-14', event: 'Completed daily check-in', type: 'success' as const },
      { date: '2024-12-13', event: 'Missed medication: Metformin', type: 'danger' as const },
      { date: '2024-12-12', event: 'Uploaded lab results', type: 'info' as const },
    ],
  },
  alerts: [
    { id: 'a1', patient: 'Robert Brown', patient_id: 'CN-2024-0391', type: 'critical', message: 'Oxygen saturation dropped below 88%', time: '2 min ago' },
  ],
};

export const demoAgentMessages = [
  { id: 'ag1', type: 'agent' as const, text: 'Good morning, Sarah! Time for your daily check-in. How are you feeling today?', time: '9:00 AM' },
];
