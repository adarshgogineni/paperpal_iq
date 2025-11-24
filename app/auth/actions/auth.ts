"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function login(
  prevState: { error: string | null },
  formData: FormData
) {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  // Validate input
  const validation = loginSchema.safeParse(data)
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    }
  }

  // Sign in with Supabase
  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return {
      error: error.message,
    }
  }

  redirect("/dashboard")
}

export async function signup(
  prevState: { error: string | null; success: string | null },
  formData: FormData
) {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  }

  // Validate input
  const validation = signupSchema.safeParse(data)
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
      success: null,
    }
  }

  // Sign up with Supabase
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return {
      error: error.message,
      success: null,
    }
  }

  return {
    error: null,
    success: "Check your email to confirm your account!",
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
