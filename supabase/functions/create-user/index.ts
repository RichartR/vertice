import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cabeceras CORS necesarias para que el navegador acepte la respuesta
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // El navegador envía primero un preflight OPTIONS antes de la petición real
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // -------------------------------------------------------
    // 1. Verificar que el caller está autenticado
    //
    // Las Edge Functions de Supabase reciben el token JWT del
    // usuario en la cabecera Authorization. Lo usamos para
    // crear un cliente con los permisos de ese usuario (anon key)
    // y así aprovechar el RLS de Supabase para validar el rol.
    // -------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Obtenemos el usuario autenticado a partir del token
    const { data: { user: caller } } = await supabaseClient.auth.getUser()
    if (!caller) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    // Verificamos que el usuario es admin consultando su perfil.
    // Nota: el RLS de profiles permite que cada usuario vea su
    // propio perfil, así que esta query siempre devuelve datos.
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('rol')
      .eq('id', caller.id)
      .single()

    if (profile?.rol !== 'admin') {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // -------------------------------------------------------
    // 2. Crear el usuario con el Admin API (service_role)
    //
    // La service_role key tiene permisos de superusuario y
    // nunca debe enviarse al frontend. Aquí en la Edge Function
    // es seguro usarla porque el código corre en el servidor.
    //
    // Usamos inviteUserByEmail en lugar de createUser porque:
    // - Envía automáticamente un email al empleado para que
    //   establezca su propia contraseña (más seguro)
    // - El admin nunca conoce la contraseña del empleado
    // - No hay que gestionar contraseñas provisionales
    // -------------------------------------------------------
    const { nombre, email, rol } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      // Los metadatos se pasan al trigger handle_new_user,
      // que los usa para rellenar la tabla profiles automáticamente
      data: { nombre, rol }
    })

    if (error) throw error

    return new Response(JSON.stringify({ user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
