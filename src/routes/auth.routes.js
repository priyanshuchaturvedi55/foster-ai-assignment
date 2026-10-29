const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validations/auth.validation');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

// Employee / Counselor Registration
router.post('/register', validate(registerSchema), authController.register);

// Employee / Counselor Login
router.post('/login', validate(loginSchema), authController.login);

// Current Logged-in Counselor Profile
router.get('/me', authenticate, authController.getMe);

module.exports = router;
