const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const pdfRoutes = require('./routes/pdfRoutes');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 3000;

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use('/api/pdf', pdfRoutes);
app.use(errorHandler);

fs.ensureDirSync(path.join(__dirname, 'uploads'));
fs.ensureDirSync(path.join(__dirname, 'processed'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
