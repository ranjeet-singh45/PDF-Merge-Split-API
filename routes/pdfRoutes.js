const express = require('express');
const router = express.Router();
const multer = require('multer');
const { mergePDFs, splitPDF, downloadAndCleanup, checkStatus } = require('../controllers/pdfController');
const upload = multer({ dest: 'uploads/' });

router.post('/merge', upload.array('pdfs', 10), mergePDFs);
router.post('/split', upload.single('pdf'), splitPDF);
router.get('/download/:filename', downloadAndCleanup);
router.get('/status/:taskId', checkStatus);

module.exports = router;
