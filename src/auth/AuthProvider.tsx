import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string, metadata?: { name?: string; skillLevel?: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return
        setSession(data.session)
      })
      .finally(() => mounted && setLoading(false))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    async signInWithGoogle() {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
    },
    async signInWithEmail(email: string) {
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      })
    },
    async signInWithPassword(email: string, password: string) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    },
    async signUpWithPassword(email: string, password: string, metadata?: { name?: string; skillLevel?: string }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata?.name,
            skill_level: metadata?.skillLevel,
          },
        },
      })
      if (error) throw error

      // Update profile with username and skill_level
      // Note: Database trigger creates profile with default values on signup
      if (data.user) {
        const profileData = {
          username: metadata?.name || email.split('@')[0],
          skill_level: metadata?.skillLevel || 'Beginner',
        }
        console.log('Updating profile with data:', profileData)

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', data.user.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
          // Don't throw error here, as auth signup was successful
        } else {
          console.log('Profile updated successfully')
        }
      }
    },
    async signOut() {
      await supabase.auth.signOut()
    },
  }), [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

