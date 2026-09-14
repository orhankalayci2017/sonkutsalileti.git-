'use strict';
const path = require('node:path');
const { createApp } = require('./app');

const { ADMIN_PASSWORD, SESSION_SECRET } = process.env;
if (!ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error('ADMIN_PASSWORD ve SESSION_SECRET ortam değişkenleri zorunlu.');
  process.exit(1);
}

const app = createApp({
  contentDir: process.env.CONTENT_DIR || path.resolve(__dirname, '..', '..'),
  adminPassword: ADMIN_PASSWORD,
  sessionSecret: SESSION_SECRET,
});
// Ters vekil (nginx vb.) arkasında gerçek istemci adresi ve https bilgisi için.
app.set('trust proxy', 1);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Panel http://localhost:${port}/anlam-cevirisi/`));
