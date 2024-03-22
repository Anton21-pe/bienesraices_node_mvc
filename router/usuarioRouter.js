import express from 'express';
import { formularioLogin, autenticando, cerrarSesion, formularioRegistro, registrar, confirmar, formularioOlvidePassword, resetPassword, comprobarToken, nuevoPassword } from '../controllers/usuarioController.js';

//Crear la app
const router = express.Router();

router.get('/login', formularioLogin);
router.post('/login', autenticando);
router.post('/cerrarSesion', cerrarSesion);
router.get('/registro', formularioRegistro);
router.post('/registro', registrar);
router.get('/confirmar/:token', confirmar);
router.get('/olvidepassword', formularioOlvidePassword);
router.post('/olvidepassword', resetPassword);
router.get('/olvidepassword/:token', comprobarToken);
router.post('/olvidepassword/:token', nuevoPassword);

export default router