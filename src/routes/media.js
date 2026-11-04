const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const publicUploadsDir = path.join(__dirname, '../public/uploads');
const dataUploadsDir = path.join(__dirname, '../../data/uploads');

// Ensure upload directories exist
if (!fs.existsSync(publicUploadsDir)) fs.mkdirSync(publicUploadsDir, { recursive: true });
if (!fs.existsSync(dataUploadsDir)) fs.mkdirSync(dataUploadsDir, { recursive: true });

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicUploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Helper to sync file to data/uploads
function syncToDataUploads(filename) {
  try {
    const src = path.join(publicUploadsDir, filename);
    const dest = path.join(dataUploadsDir, filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  } catch (e) {
    console.error('Failed to sync to data/uploads:', e);
  }
}

// 1. GET /api/media - List all uploaded media files
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(publicUploadsDir);
    const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']);

    const mediaList = files
      .filter(file => imageExtensions.has(path.extname(file).toLowerCase()))
      .map(file => {
        const fullPath = path.join(publicUploadsDir, file);
        const stats = fs.statSync(fullPath);
        return {
          id: file,
          url: `/uploads/${file}`,
          title: path.parse(file).name.replace(/^[0-9]+_/, '').replace(/_/g, ' '),
          size: stats.size,
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(mediaList);
  } catch (err) {
    console.error('Error listing media:', err);
    res.status(500).json({ error: 'Could not load media library' });
  }
});

// 2. POST /api/media/upload-bulk - Handle base64 dataUrl or multipart uploads
router.post('/upload-bulk', upload.array('files'), (req, res) => {
  try {
    const uploaded = [];
    const failed = [];

    // Case A: Multipart uploaded files via Multer
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        syncToDataUploads(file.filename);
        uploaded.push({
          id: file.filename,
          url: `/uploads/${file.filename}`,
          title: path.parse(file.filename).name.replace(/^[0-9]+_/, '').replace(/_/g, ' '),
          size: file.size
        });
      }
    }

    // Case B: JSON body with base64 dataUrls
    if (req.body && req.body.files && Array.isArray(req.body.files)) {
      for (const item of req.body.files) {
        try {
          const { dataUrl, fileName = 'image.jpg' } = item;
          if (!dataUrl) continue;

          const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            failed.push({ error: 'Invalid base64 data URL', fileName });
            continue;
          }

          const buffer = Buffer.from(matches[2], 'base64');
          const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const uniqueFilename = `${Date.now()}_${safeName}`;
          const savePath = path.join(publicUploadsDir, uniqueFilename);

          fs.writeFileSync(savePath, buffer);
          syncToDataUploads(uniqueFilename);

          uploaded.push({
            id: uniqueFilename,
            url: `/uploads/${uniqueFilename}`,
            title: path.parse(safeName).name.replace(/_/g, ' '),
            size: buffer.length
          });
        } catch (itemErr) {
          failed.push({ error: itemErr.message, fileName: item.fileName });
        }
      }
    }

    res.json({ uploaded, failed });
  } catch (err) {
    console.error('Error in bulk upload:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// 3. POST /api/media/upload - Single image or link upload
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    // If multipart file uploaded
    if (req.file) {
      syncToDataUploads(req.file.filename);
      return res.json({
        id: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        title: path.parse(req.file.filename).name.replace(/^[0-9]+_/, '').replace(/_/g, ' '),
        size: req.file.size
      });
    }

    // If external URL provided
    if (req.body && req.body.url) {
      const { url, title } = req.body;
      return res.json({
        id: `ext_${Date.now()}`,
        url,
        title: title || url.split('/').pop() || 'External Image',
        size: 0
      });
    }

    res.status(400).json({ error: 'No file or URL provided' });
  } catch (err) {
    console.error('Error in single upload:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// 4. DELETE /api/media/:id - Delete media file
router.delete('/:id', (req, res) => {
  try {
    const filename = path.basename(req.params.id);
    const pubFile = path.join(publicUploadsDir, filename);
    const dataFile = path.join(dataUploadsDir, filename);

    if (fs.existsSync(pubFile)) fs.unlinkSync(pubFile);
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    console.error('Error deleting media:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
