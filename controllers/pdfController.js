const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const statusMap = {};
const { exec } = require('child_process');

exports.mergePDFs = async (req, res, next) => {
  const taskId = uuidv4();
  statusMap[taskId] = 'processing';

  try {
    if (!req.files || req.files.length < 2) {
      statusMap[taskId] = 'failed';
      return res.status(400).json({ error: 'At least two PDF files are required' });
    }

    const mergedPdf = await PDFDocument.create();
    for (const file of req.files) {
      const pdfBytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const tempOutput = path.join('processed', `temp-${uuidv4()}.pdf`);
    const finalOutput = path.join('processed', `merged-${uuidv4()}.pdf`);

    fs.writeFileSync(tempOutput, await mergedPdf.save());

    // Apply password protection if requested
    if (req.body.password) {
      const password = req.body.password;
      exec(`qpdf --encrypt ${password} ${password} 256 -- ${tempOutput} ${finalOutput}`, (err) => {
        fs.unlinkSync(tempOutput);
        if (err) return next(err);

        req.files.forEach(f => fs.unlink(f.path, () => {}));
        statusMap[taskId] = 'completed';
        res.json({ message: 'Merged and password protected', file: path.basename(finalOutput), taskId });
      });
    } else {
      fs.renameSync(tempOutput, finalOutput);
      req.files.forEach(f => fs.unlink(f.path, () => {}));
      statusMap[taskId] = 'completed';
      res.json({ message: 'Merged successfully', file: path.basename(finalOutput), taskId });
    }
  } catch (err) {
    statusMap[taskId] = 'failed';
    next(err);
  }
};


exports.splitPDF = async (req, res, next) => {
  const taskId = uuidv4();
  const statusMap = global.statusMap || {};
  statusMap[taskId] = 'processing';

  try {
    const ranges = req.body.ranges || '1';
    const password = req.body.password;

    if (!req.file || !ranges) {
      statusMap[taskId] = 'failed';
      return res.status(400).json({ error: 'PDF file and page ranges are required' });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const rangeList = ranges.split(',').map(r => r.trim().split('-').map(Number));
    const splitFiles = [];

    for (const [start, end] of rangeList) {
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, Array.from({ length: end - start + 1 }, (_, i) => i + start - 1));
      copiedPages.forEach(page => newPdf.addPage(page));

      const tempOutput = path.join('processed', `temp-${uuidv4()}.pdf`);
      const finalOutput = path.join('processed', `split-${uuidv4()}.pdf`);
      fs.writeFileSync(tempOutput, await newPdf.save());

      if (password) {
        // Apply password protection with qpdf
        await new Promise((resolve, reject) => {
          exec(`qpdf --encrypt ${password} ${password} 256 -- ${tempOutput} ${finalOutput}`, (err) => {
            fs.unlinkSync(tempOutput); // delete temp file either way
            if (err) return reject(err);
            splitFiles.push(path.basename(finalOutput));
            resolve();
          });
        });
      } else {
        fs.renameSync(tempOutput, finalOutput);
        splitFiles.push(path.basename(finalOutput));
      }
    }

    fs.unlink(req.file.path, () => {});
    statusMap[taskId] = 'completed';
    res.json({ message: 'Split completed', files: splitFiles, taskId });
  } catch (err) {
    statusMap[taskId] = 'failed';
    next(err);
  }
};

exports.downloadAndCleanup = (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join('processed', filename);

    // Check if the file exists first
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).json({ error: 'File not found' });
        }

        // Stream the file for download
        res.download(filePath, filename, (downloadErr) => {
            if (downloadErr) {
                console.error(`Download failed: ${filename}`, downloadErr);
                return next(downloadErr);
            }

            // Delete after successful download
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Failed to delete after download: ${filePath}`, unlinkErr);
                } else {
                    console.log(`File deleted after download: ${filename}`);
                }
            });
        });
    });
};

exports.checkStatus = (req, res) => {
    const taskId = req.params.taskId;
    const status = statusMap[taskId] || 'unknown';
    res.json({ taskId, status });
};