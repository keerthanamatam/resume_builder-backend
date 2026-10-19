const express = require('express');
const router = express.Router();
const { login, register, refresh, logout } = require('../controllers/userControllers');

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.delete('/logout', logout)

module.exports = router;