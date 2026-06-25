import express from 'express';
import { loginPorPin } from '../controllers/authController.js';

const router = express.Router();

// Definimos la ruta POST para el login
router.post('/login', loginPorPin);

export default router;