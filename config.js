module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost/usuarios",
  PORT: process.env.PORT || 3000,
  SMTP_PASS: process.env.CCJ_SMTP_PASSWORD,
  SMTP_USER: process.env.CCJ_SMTP_USER,
};
