# 📄 PDF Merge & Split API (Node.js + Express)

This backend-only project allows you to:
- Upload and merge multiple PDFs
- Split a PDF based on page ranges
- Optionally password-protect output PDFs
- Download generated files (auto-deletion after download)
- Track processing status using task IDs

---

##  Features

-  Merge PDFs (with optional password)
-  Split PDFs by page ranges (with optional password)
-  Encrypt output using `qpdf`
-  Status endpoint to track long tasks
-  File download with auto-delete
-  Swagger docs at `/api-docs`

---

##  Tech Stack
- Node.js 
- Express.js
- `pdf-lib`
- `multer`
- `uuid`
- `qpdf` (system dependency for encryption)

---

##  Installation & Setup

### 1.  Install dependencies
```bash
npm install
```

### 2.  Install `qpdf`
**Required for password protection**

#### macOS
```bash
brew install qpdf
```
#### Ubuntu/Debian
```bash
sudo apt install qpdf
```
#### Windows
- Download from [https://qpdf.sourceforge.io/](https://qpdf.sourceforge.io/)
- Add qpdf to your PATH

### 3. Run the server
```bash
npm start
```
Server starts on `http://localhost:3000`

---

##  API Usage

###  Merge PDFs
```http
POST /api/pdf/merge
```
**form-data:**
- `pdfs`: multiple files
- `password` (optional)

###  Split PDF
```http
POST /api/pdf/split
```
**form-data:**
- `pdf`: single file
- `ranges`: e.g., `1-2,3-4`
- `password` (optional)

###  Download File
```http
GET /api/pdf/download/:filename
```
Auto-deletes after download.

###  Check Task Status
```http
GET /api/pdf/status/:taskId
```
Returns `processing`, `completed`, `failed`, or `unknown`.

###  Swagger API Docs
```
GET /api-docs
```

##  Notes
- Uploaded files are auto-deleted after processing.
- Processed files are deleted after download.
- Password-protection requires `qpdf`.

```
