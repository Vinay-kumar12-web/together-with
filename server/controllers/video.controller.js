const supabase = require('../config/supabase');
const fs       = require('fs');
const path     = require('path');

// Save video metadata after upload
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No video file provided' });

    const { roomId, title } = req.body;
    if (!roomId) return res.status(400).json({ message: 'Room ID required' });

    // Verify user is room member
    const { data: member } = await supabase
      .from('room_members')
      .select('id').eq('room_id', roomId).eq('user_id', req.user.id).single();
    if (!member) return res.status(403).json({ message: 'Not a member of this room' });

    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        room_id:     roomId,
        uploaded_by: req.user.id,
        title:       title || req.file.originalname,
        filename:    req.file.filename,
        file_size:   req.file.size,
      })
      .select().single();

    if (error) throw error;

    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get videos for a room
const getRoomVideos = async (req, res) => {
  try {
    const { roomId } = req.params;

    const { data: member } = await supabase
      .from('room_members')
      .select('id').eq('room_id', roomId).eq('user_id', req.user.id).single();
    if (!member) return res.status(403).json({ message: 'Not a member' });

    const { data: videos } = await supabase
      .from('videos').select('*').eq('room_id', roomId)
      .order('created_at', { ascending: false });

    res.json(videos || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: video } = await supabase.from('videos').select('*').eq('id', id).single();
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.uploaded_by !== req.user.id) return res.status(403).json({ message: 'Not your video' });

    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'uploads', video.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await supabase.from('videos').delete().eq('id', id);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { uploadVideo, getRoomVideos, deleteVideo };
