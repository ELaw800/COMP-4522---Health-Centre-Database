import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// automation for new-patients
export async function addPatient(patient, address) {
  // 1. Insert the address and get its generated id back
  const { data: newAddress, error: addressError } = await supabase
    .from('address')
    .insert([address])
    .select('address_id')
    .single();

  if (addressError) return { data: null, error: addressError };

  // 2. Insert the patient, linked to that address
  const { data, error } = await supabase
    .from('patients')
    .insert([{ ...patient, address_id: newAddress.address_id }]);

  return { data, error };
}

// automation for book
// List doctors for the booking dropdown
export async function getDoctors() {
  return await supabase
    .from('staff')
    .select('staff_id, first_name, last_name, qualifications')
    .eq('staff_role', 'Doctor')
    .order('last_name');
}

// Find a registered patient by name + date of birth (the fields registration collects)
export async function findPatient({ first_name, last_name, date_of_birth }) {
  // case-insensitive exact match; escape LIKE wildcards in user input
  const exact = (v) => v.trim().replace(/[\\%_]/g, '\\$&');
  return await supabase
    .from('patients')
    .select('patient_id')
    .ilike('first_name', exact(first_name))
    .ilike('last_name', exact(last_name))
    .eq('date_of_birth', date_of_birth)
    .limit(1)
    .maybeSingle();
}

// Look up the patient, then insert the appointment for them
export async function addAppointment(patientInfo, appointment) {
  const { data: patient, error: patientError } = await findPatient(patientInfo);

  if (patientError) return { data: null, error: patientError };
  if (!patient) {
    return { data: null, error: { message: 'No registered patient matches that name and date of birth.' } };
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert([{ ...appointment, patient_id: patient.patient_id }]);

  return { data, error };
}

// automation for login
// Patients log in with their patient ID (e.g. 12), staff with their staff code (e.g. pemv12).
// The database checks the password; the browser only remembers who logged in.
export async function logIn(id, password) {
  id = id.trim().toLowerCase();
  let role, result;

  if (/^pemv\d+$/.test(id)) {
    role = 'staff';
    result = await supabase.rpc('staff_login', { p_code: id, p_password: password });
  } else if (/^\d+$/.test(id)) {
    role = 'patient';
    id = Number(id);
    result = await supabase.rpc('patient_login', { p_id: id, p_password: password });
  } else {
    return { error: { message: 'Enter your patient ID number, or your staff code (pemv...).' } };
  }

  if (result.error) return { error: result.error };
  if (!result.data) return { error: { message: 'Wrong ID or password.' } };

  // Kept for this tab only (cleared when it closes). Other pages send these to the
  // database functions, which re-check the password on every call.
  sessionStorage.setItem('user', JSON.stringify({ role, id, password }));
  return { error: null };
}

// Who is logged in: { role: 'patient' | 'staff', id, password } or null
export function getUser() {
  return JSON.parse(sessionStorage.getItem('user'));
}

export function logOut() {
  sessionStorage.removeItem('user');
}
