'use server'

import { createClient } from '../utils/supabase/server';

export async function joinQueue(formData: FormData, slug: string) {
    const supabase = await createClient();

    // 1. Get the data from the form
    const name = formData.get('patientName') as string;
    const phone = formData.get('phoneNumber') as string;

    if (!name || !phone) {
        return { error: 'Name and phone number are required.' };
    }

    // Clean up the slug
    const cleanSlug = slug ? slug.trim().toLowerCase() : '';

    // 2. Find the clinic in the database
    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('slug', cleanSlug)
        .single();

    if (clinicError || !clinic) {
        console.error("Supabase Clinic Error Details:", clinicError);
        return { error: 'Clinic not found. Check the URL.' };
    }

    // 3. GENERATE THE NEXT TOKEN NUMBER
    // Get the highest existing token number for this clinic
    const { data: existingTokens } = await supabase
        .from('tokens')
        .select('token_number')
        .eq('clinic_id', clinic.id)
        .order('token_number', { ascending: false })
        .limit(1);

    // If there is a token, add 1. If not, start at 1.
    const nextTokenNumber = existingTokens && existingTokens.length > 0
        ? Number(existingTokens[0].token_number) + 1
        : 1;

    // 4. Insert the new patient into the tokens table
    const { data: token, error: insertError } = await supabase
        .from('tokens')
        .insert([
            {
                clinic_id: clinic.id,
                patient_name: name,
                patient_phone: phone,
                status: 'waiting',
                token_number: nextTokenNumber // <-- We added the missing column here!
            }
        ])
        .select('id')
        .single();

    if (insertError || !token) {
        console.error("Supabase Insert Error:", insertError);
        return { error: `Insert Error: ${insertError?.message || 'Unknown database error'}` };
    }

    // 5. Return success and the token ID so the frontend can handle navigation
    return { success: true, tokenId: token.id };
}