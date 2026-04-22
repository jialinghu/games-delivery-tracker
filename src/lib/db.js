import { supabase } from './supabase'

// ─── SPACES ────────────────────────────────────────────────────
export async function fetchSpaces() {
  if (!supabase) return []
  const { data } = await supabase.from('spaces').select('*').order('created_at')
  return data || []
}

export async function createSpace(space) {
  if (!supabase) return null
  const { data } = await supabase.from('spaces').insert(space).select().single()
  return data
}

// ─── FOLDERS ───────────────────────────────────────────────────
export async function fetchFolders() {
  if (!supabase) return []
  const { data } = await supabase.from('folders').select('*').order('created_at')
  return data || []
}

export async function createFolder(folder) {
  if (!supabase) return null
  const { data } = await supabase.from('folders').insert(folder).select().single()
  return data
}

// ─── TASKS ─────────────────────────────────────────────────────
export async function fetchTasks() {
  if (!supabase) return []
  const { data } = await supabase.from('tasks').select('*').order('due_date')
  return data || []
}

export async function createTask(task) {
  if (!supabase) return null
  const { data } = await supabase.from('tasks').insert(task).select().single()
  return data
}

export async function updateTask(id, updates) {
  if (!supabase) return null
  const { data } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
  return data
}

export async function deleteTask(id) {
  if (!supabase) return
  await supabase.from('tasks').delete().eq('id', id)
}

// ─── ADMIN: User management ────────────────────────────────────
export async function fetchProfiles() {
  if (!supabase) return []
  const { data } = await supabase.from('profiles').select('*').order('created_at')
  return data || []
}

export async function updateProfile(id, updates) {
  if (!supabase) return null
  const { data } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
  return data
}

// Admin creates user via Supabase Edge Function (see /supabase/functions/create-user)
export async function adminCreateUser(email, password, displayName, role) {
  if (!supabase) return { error: 'Supabase not configured' }
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, display_name: displayName, role }
  })
  return { data, error }
}
