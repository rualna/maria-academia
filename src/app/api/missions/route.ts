import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('speaking_missions')
    .select('*')
    .eq('target_level', 'A1')
    .limit(1)
    .single()

  if (error) {
    return Response.json({ success: false, error: error.message })
  }

  return Response.json({
    success: true,
    mission: data,
  })
}