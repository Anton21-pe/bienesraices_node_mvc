import express from "express";
import usuarioRouter from './router/usuarioRouter.js'
import mispropiedadesRouter from './router/mispropiedadesRouter.js'
import db from './config/db.js'
import csurf from "csurf"
import cookieParser from "cookie-parser"
import appRouter from './router/appRouter.js'
import apiRouter from './router/apiRouter.js'


//Crear la app
const app = express()

//Habilitar lectura de datos de formulario
app.use( express.urlencoded({extended: true}))

//Habilitar Cookie Parser
app.use(cookieParser())

//Habiliar CSRF
app.use(csurf({cookie: true}))

//Conexión a la base de datos
try {
    await db.authenticate();
    db.sync();
    console.log('Conexión correcto a la base de datos.')
} catch (error) {
    console.log(error)
}

//Habilitar Pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta publicas
app.use(express.static('public'))

//Routing
app.use('/', appRouter)
app.use('/auth', usuarioRouter)
app.use('/', mispropiedadesRouter)
app.use('/api', apiRouter)

//Definir un puerto y arrancar el proyecto
const port = 3000;

app.listen(port, () => {
    console.log(`El servidor esta funcionando en el puerto ${port}`)
});