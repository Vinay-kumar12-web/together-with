const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadVideo, getRoomVideos, deleteVideo } = require('../controllers/video.controller');

router.post('/upload',        protect, upload.single('video'), uploadVideo);
router.get('/room/:roomId',   protect, getRoomVideos);
router.delete('/:id',         protect, deleteVideo);

module.exports = router;
