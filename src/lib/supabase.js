import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://negjokrzczobpordxsjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ2pva3J6Y3pvYnBvcmR4c2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjcyNzIsImV4cCI6MjA4MTcwMzI3Mn0.jsqus75rHc1gIWAVCRooyqNC5i6uWerg0uX2oprawR4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper pour obtenir l'utilisateur courant
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper pour obtenir le profil organisateur
export const getOrganizerProfile = async (userId) => {
  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Helper pour obtenir les événements d'un organisateur
export const getOrganizerEvents = async (organizerId) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('starts_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Helper pour obtenir les billets d'un événement
export const getEventTickets = async (eventId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', eventId);
  
  if (error) throw error;
  return data;
};

// Helper pour valider un billet (scan)
export const validateTicket = async (qrToken, eventId) => {
  // Chercher le billet par son qr_token
  const { data: ticket, error: findError } = await supabase
    .from('tickets')
    .select('*, events!inner(id, title, organizer_id)')
    .eq('qr_token', qrToken)
    .single();
  
  if (findError || !ticket) {
    return { success: false, error: 'invalid', message: 'Billet invalide ou introuvable' };
  }
  
  // Vérifier que le billet appartient au bon événement
  if (ticket.event_id !== eventId) {
    return { 
      success: false, 
      error: 'wrong_event', 
      message: 'Ce billet appartient à un autre événement',
      ticket 
    };
  }
  
  // Vérifier si le billet a déjà été utilisé
  if (ticket.status === 'used' || ticket.used_at) {
    return { 
      success: false, 
      error: 'already_scanned', 
      message: 'Ce billet a déjà été scanné',
      ticket,
      scannedAt: ticket.used_at
    };
  }
  
  // Vérifier le statut du billet
  if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
    return { 
      success: false, 
      error: 'cancelled', 
      message: 'Ce billet a été annulé ou remboursé',
      ticket 
    };
  }
  
  // Marquer le billet comme utilisé
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ 
      status: 'used',
      used_at: new Date().toISOString()
    })
    .eq('id', ticket.id);
  
  if (updateError) {
    return { success: false, error: 'update_failed', message: 'Erreur lors de la validation' };
  }
  
  return { 
    success: true, 
    message: 'Billet validé avec succès',
    ticket 
  };
};

// Helper pour obtenir les statistiques d'un événement
export const getEventStats = async (eventId) => {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('status, used_at')
    .eq('event_id', eventId);
  
  if (error) throw error;
  
  const total = tickets.length;
  const scanned = tickets.filter(t => t.status === 'used' || t.used_at).length;
  const valid = tickets.filter(t => t.status === 'valid' && !t.used_at).length;
  
  return { total, scanned, valid };
};
