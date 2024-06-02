'use client'
import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '@/database/supabase'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const Authentication = () => {
  return (
    <Auth
      supabaseClient={supabase}
      theme='default'
      providers={[]}
      appearance={{ theme: ThemeSupa }}
    />
  )
}

export default Authentication
