const express = require('express');
const router = express.Router();

const registerController = require('../controllers/auth/registerController.js');
const loginController = require('../controllers/auth/loginController.js');
const logoutController = require('../controllers/auth/logoutController.js');
// const refreshTokenController = require('../controllers/auth/refreshTokenController');

router.post('/register', registerController);
router.post('/login', loginController);
router.get('/logout', logoutController);
// router.get('/refresh', refreshTokenController);

module.exports = router;
