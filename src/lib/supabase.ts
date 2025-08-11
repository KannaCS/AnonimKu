import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  name: string
  phone: string
  is_online: boolean
  is_in_chat: boolean
  profile_revealed_to: string | null
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  user1_id: string
  user2_id: string
  status: 'active' | 'ended'
  both_profiles_revealed: boolean
  created_at: string
  ended_at: string | null
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface RevealRequest {
  id: string
  match_id: string
  requester_id: string
  target_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  responded_at: string | null
}

// Database functions
export const dbFunctions = {
  // Create or update user
  async upsertUser(userData: { name: string; phone: string }) {
    const { data, error } = await supabase
      .from('users')
      .upsert({ 
        phone: userData.phone, 
        name: userData.name,
        is_online: true 
      }, { 
        onConflict: 'phone',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    return { data, error }
  },

  // Find match for user
  async findMatch(userId: string) {
    try {
      const { data, error } = await supabase.rpc('find_match_for_user', {
        user_id: userId
      })

      // If there's an error with actual content, return it
      if (error && error.message && error.message.trim() !== '') {
        return { data: null, error }
      }

      // Return the data (which could be null if no match found), with no error
      return { data: data || null, error: null }
    } catch (err) {
      // Only return actual errors
      return { data: null, error: err }
    }
  },

  // Get active match for user
  async getActiveMatch(userId: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:user1_id(id, name, phone),
        user2:user2_id(id, name, phone)
      `)
      .eq('status', 'active')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    return { data, error }
  },

  // Get messages for a match
  async getMessages(matchId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    return { data, error }
  },

  // Send message
  async sendMessage(matchId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content
      })
      .select()
      .single()

    return { data, error }
  },

  // Request profile reveal
  async requestReveal(matchId: string, requesterId: string, targetId: string) {
    const { data, error } = await supabase
      .from('reveal_requests')
      .insert({
        match_id: matchId,
        requester_id: requesterId,
        target_id: targetId
      })
      .select()
      .single()

    return { data, error }
  },

  // Respond to reveal request
  async respondToReveal(requestId: string, status: 'accepted' | 'rejected') {
    const { data, error } = await supabase
      .from('reveal_requests')
      .update({ 
        status, 
        responded_at: new Date().toISOString() 
      })
      .eq('id', requestId)
      .select()
      .single()

    // If accepted, update match to show both profiles are revealed
    if (status === 'accepted' && data) {
      await supabase
        .from('matches')
        .update({ both_profiles_revealed: true })
        .eq('id', data.match_id)
    }

    return { data, error }
  },

  // End match
  async endMatch(matchId: string) {
    const { error } = await supabase.rpc('end_match', {
      match_id: matchId
    })

    return { error }
  },

  // Update user online status
  async updateOnlineStatus(userId: string, isOnline: boolean) {
    const { error } = await supabase
      .from('users')
      .update({ is_online: isOnline })
      .eq('id', userId)

    return { error }
  },

  // Get pending reveal requests for user
  async getPendingRevealRequests(userId: string) {
    const { data, error } = await supabase
      .from('reveal_requests')
      .select(`
        *,
        requester:requester_id(name),
        match:match_id(*)
      `)
      .eq('target_id', userId)
      .eq('status', 'pending')

    return { data, error }
  }
}