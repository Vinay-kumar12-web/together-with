const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Generate short invite code
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Create a new watch room
const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name required' });

    const invite_code = genCode();

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ name, invite_code, created_by: req.user.id })
      .select().single();

    if (error) throw error;

    // Add creator as member
    await supabase.from('room_members').insert({ room_id: room.id, user_id: req.user.id });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Join room with invite code
const joinRoom = async (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) return res.status(400).json({ message: 'Invite code required' });

    const { data: room, error } = await supabase
      .from('rooms').select('*').eq('invite_code', invite_code.toUpperCase()).single();

    if (error || !room) return res.status(404).json({ message: 'Room not found. Check the invite code.' });

    // Check if already a member
    const { data: existing } = await supabase
      .from('room_members')
      .select('id').eq('room_id', room.id).eq('user_id', req.user.id).single();

    if (!existing) {
      await supabase.from('room_members').insert({ room_id: room.id, user_id: req.user.id });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all rooms user belongs to
const getMyRooms = async (req, res) => {
  try {
    const { data: memberships } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', req.user.id);

    if (!memberships?.length) return res.json([]);

    const roomIds = memberships.map(m => m.room_id);
    const { data: rooms } = await supabase
      .from('rooms').select('*').in('id', roomIds);

    res.json(rooms || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get room details + members
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is a member
    const { data: member } = await supabase
      .from('room_members')
      .select('id').eq('room_id', id).eq('user_id', req.user.id).single();

    if (!member) return res.status(403).json({ message: 'Not a member of this room' });

    const { data: room } = await supabase.from('rooms').select('*').eq('id', id).single();
    const { data: members } = await supabase
      .from('room_members')
      .select('user_id, joined_at, users(id, name, avatar_color)')
      .eq('room_id', id);

    const { data: messages } = await supabase
      .from('messages')
      .select('*').eq('room_id', id)
      .order('created_at', { ascending: true })
      .limit(100);

    const { data: videos } = await supabase
      .from('videos').select('*').eq('room_id', id)
      .order('created_at', { ascending: false });

    res.json({ room, members, messages: messages || [], videos: videos || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save chat message to DB
const saveMessage = async (req, res) => {
  try {
    const { roomId, content } = req.body;
    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: req.user.id, user_name: req.user.name, content })
      .select().single();
    if (error) throw error;
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRoom, joinRoom, getMyRooms, getRoomById, saveMessage };
