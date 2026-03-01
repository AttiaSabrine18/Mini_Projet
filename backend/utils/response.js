'use strict';

// ─── Format uniforme des réponses API ─────────────────────────────────────────

const success = (res, data = {}, message = 'Succès', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = 'Erreur serveur', statusCode = 500, details = null) => {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
};

module.exports = { success, error };
