import { check, validationResult } from "express-validator"
import Usuario from "../models/Usuario.js"
import { generarID, generarJWT } from "../helpers/tokens.js"
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js"
import bcrypt from "bcrypt"


const formularioLogin = (req, res)=> {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticando = async (req, res)=> {
     //Validacion
     await check('email').isEmail().withMessage('Eso email es obligatorio.').run(req);
     await check('password').notEmpty().withMessage('El password es obligatorio.').run(req);

     let resultado = validationResult(req)

     if(!resultado.isEmpty()){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //Comprobar si usuario existe
    const {email, password} =req.body;
    const usuario = await Usuario.findOne({where: {email}})

    if(!usuario){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El usuario no existe.'}]
        })
    }

    //Comprobar usuario confirmado
    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Tu cuenta no ha sido confirmada.'}]
        })
    }
    
    //Comprobar password correcto
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'credenciales incorrectas.'}]
        })
    }

    //Autenticar el usuario
    // const jwtToken = jwt.sign({
    //     nombre: 'juan',
    //     empresa: 'Codigo con Juan',
    //     tecnologias: 'Node.js'       
    // }, "palabrasecreta", {
    //     expiresIn: '1d'
    // })

    const jwtToken = generarJWT({id: usuario.id, nombre: usuario.nombre});
    console.log(jwtToken);

    //Almacenar jwt en cookies
    return res.cookie('_token', jwtToken, {
        httpOnly: true,
        secure: true
    }).redirect('/mispropiedades')
}

const cerrarSesion = (req, res ) => {
    console.log('cerrando sesión ...')
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegistro = (req, res)=> {
    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken: req.csrfToken(),
    })
}

const registrar = async (req, res)=> {
    //Validacion
    await check('nombre').notEmpty().withMessage('El nombre es obligatorio.').run(req);
    await check('email').isEmail().withMessage('Eso no parece un email.').run(req);
    await check('password').isLength({min: 6}).withMessage('El password debe ser al menos de 6 carácteres.').run(req);
    //await check('repetir_password').equals('password').withMessage('Los passwords no son iguales.').run(req);

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    const {nombre, email, password} = req.body

    const existeUsuario = await Usuario.findOne({ where : { email : email}});
    if (existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Usuario ya registrado.'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Almacenar usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarID()
    })

    //Envia email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Cuentra creada correctamente.',
        mensaje: 'Hemos enviado un email de confirmación, presiona el enlace.'
    })
}

const confirmar = async (req, res) => {
    console.log(req.params.token)

    const {token} = req.params;
    //Verificar si el token es valido.
    const usuario = await Usuario.findOne({where: {token}})

    if (!usuario){
        return res.render('auth/confirmar-cuenta', {
                    pagina: 'Error al confirmar tu cuenta',
                    mensaje: 'Hubo un error al confirmar la cuenta. Intenta denuevo.',
                    error: true
                })
    }

    //Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmó correctamente.'
    })

}

const formularioOlvidePassword = (req, res)=> {
    res.render('auth/olvidepassword', {
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req, res) => {
    //Validación
    await check('email').isEmail().withMessage('Eso no parece un email.').run(req);
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/olvidepassword', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //Buscar usuario
    const {email} = req.body

    const usuario = await Usuario.findOne({where: {email}})

    if(!usuario){
        return res.render('auth/olvidepassword', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El email no pertenece a ningún usuario.'}]
        })
    }

    //Generar token
    usuario.token = generarID();
    await usuario.save();

    //Envia email de reestablecer password
    emailOlvidePassword({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    res.render('templates/mensaje', {
        pagina: 'Reestablecer password',
        mensaje: 'Hemos enviado un email con las instrucciones.'
    })
}

const comprobarToken = async (req, res) => {
    const {token} = req.params;

    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu password',
            mensaje: 'Hubo un error al validar tu información. Intenta denuevo.',
            error: true
        })
    }

    //Mostrar formulario para modificar password
    res.render('auth/resetpassword', {
        pagina: 'Reestablece tu password',
        csrfToken: req.csrfToken()
    })
}

const nuevoPassword = async (req, res) =>{
    //Validacion
    await check('password').isLength({min: 6}).withMessage('El password debe ser al menos de 6 carácteres.').run(req);

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/resetpassword', {
            pagina: 'Reestablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const {token} = req.params;
    const {password} = req.body;

    const usuario = await Usuario.findOne({where: {token}})

    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null
    await usuario.save()

    res.render('auth/confirmar-cuenta', {
        pagina: 'Reestablece tu password',
        mensaje: 'El password se guardó correctamente.'
    })
}

export {
    formularioLogin,
    autenticando,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}