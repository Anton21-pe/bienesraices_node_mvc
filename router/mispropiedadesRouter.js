import express from 'express';
import {admin, crear, guardar, agregarImagen, almacenarImagen, editar, guardarCambios, eliminar, cambiarEstado, mostrarPropiedad, enviarMensaje, verMensajes} from '../controllers/mispropiedadesController.js';
import {body} from 'express-validator'
import protegerRuta from '../middleware/protegerRuta.js'
import upload from '../middleware/subirImagen.js';
import importarUsuario from '../middleware/identificarUsuario.js'
import identificarUsuario from '../middleware/identificarUsuario.js';

const router = express.Router();

router.get('/mispropiedades', protegerRuta, admin);
router.get('/mispropiedades/crear', protegerRuta, crear);
router.post('/mispropiedades/crear', protegerRuta,
    body('titulo').notEmpty().withMessage('El título es obligatorio.'),
    body('descripcion').notEmpty().withMessage('La Descripción es obligatorio.'),
    body('categoria').notEmpty().withMessage('Selecciona una categoría.'),
    body('precio').notEmpty().withMessage('Selecciona un rango de precio.'),
    body('habitaciones').notEmpty().withMessage('Seleccione la cantidad de habitaciones.'),
    body('estacionamientos').notEmpty().withMessage('Seleccione el número de estacionamientos.'),
    body('wc').notEmpty().withMessage('Seleccione la cantidad de baños.'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el Mapa.'),
    guardar
);

router.get('/mispropiedades/agregarImagen/:id', protegerRuta, agregarImagen);
router.post('/mispropiedades/agregarImagen/:id', 
    protegerRuta,
    upload.single('imagen'),
    almacenarImagen
);

router.get('/mispropiedades/editar/:id', 
    protegerRuta,
    editar
);

router.post('/mispropiedades/editar/:id', 
    protegerRuta,
    body('titulo').notEmpty().withMessage('El título es obligatorio.'),
    body('descripcion').notEmpty().withMessage('La Descripción es obligatorio.'),
    body('categoria').notEmpty().withMessage('Selecciona una categoría.'),
    body('precio').notEmpty().withMessage('Selecciona un rango de precio.'),
    body('habitaciones').notEmpty().withMessage('Seleccione la cantidad de habitaciones.'),
    body('estacionamientos').notEmpty().withMessage('Seleccione el número de estacionamientos.'),
    body('wc').notEmpty().withMessage('Seleccione la cantidad de baños.'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el Mapa.'),
    guardarCambios
);

router.post('/mispropiedades/eliminar/:id', 
    protegerRuta,
    eliminar
);

router.put('/mispropiedades/:id', 
    protegerRuta,
    cambiarEstado
);

// Area publica
router.get('/propiedad/:id',
    identificarUsuario,
    mostrarPropiedad
);

// Area publica
router.post('/propiedad/:id',
    identificarUsuario,
    body('mensaje').isLength({min: 20}).withMessage('Mensaje no puede estar vacio o muy corto.'),
    enviarMensaje
);

router.get('/mensajes/:id', 
    protegerRuta,
    verMensajes
)

export default router