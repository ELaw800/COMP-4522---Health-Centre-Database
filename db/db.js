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
