import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdyaeyuertcvskvwpdfe.supabase.co'
const supabaseKey = 'sb_publishable_auL6ZSGewgvs1Mn94GmFSA_T-FfYXz6'

export const supabase = createClient(supabaseUrl, supabaseKey)