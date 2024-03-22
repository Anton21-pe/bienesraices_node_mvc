// import Precio from "../models/Precio.js"
// import Categoria from "../models/Categoria.js"
import { unlink } from 'node:fs/promises'
import {Categoria, Precio, Usuario, Propiedad, Mensaje } from '../models/Index.js'
import { validationResult } from "express-validator"
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async(req, res)=> {

    //Query string
    const { pagina: paginaActual } = req.query

    const expresion = /^[0-9]$/

    if (!expresion.test(paginaActual)){
        return res.redirect('/mispropiedades?pagina=1')
    }

    try {

        const {id} = req.usuario

        const limit = 5
        const offset = (paginaActual * limit) - limit


        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit: limit,
                offset: offset,
                where : {
                    usuarioID : id
                },
                include: [
                    { model: Categoria, as: 'categoria'},
                    { model: Precio, as: 'precio'},
                    { model: Mensaje, as: 'mensajes'}
                ]
            }),
            Propiedad.count({
                where:{
                    usuarioID : id   
                }
            })
        ])

        res.render('mispropiedades/admin',{
            pagina: 'Mis Propiedades',
            propiedades: propiedades,
            usuario: req.usuario,
            csrfToken: req.csrfToken(),
            paginas : Math.ceil( total / limit),
            paginaActual: Number(paginaActual),
            offset,
            limit,
            total
        })

    } catch (error) {
        console.log(error)      
    }  
}

const crear = async (req, res)=> {
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('mispropiedades/crear',{
        pagina: 'Crear propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

const guardar = async (req, res) =>{

    let resultado = validationResult(req)
    if(!resultado.isEmpty()){
        //Consultar categoriaas y precios
        const[categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('mispropiedades/crear', {
            pagina: 'Crear propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    const {titulo, descripcion, habitaciones, estacionamientos, wc, calle, lat, lng, precio: precioID, categoria: categoriaID} = req.body
    console.log('obteniendo valores...')
    console.log(req.usuario.id)
    const {id: usuarioID} = req.usuario

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamientos,
            wc,
            calle,
            lat,
            lng,
            precioID,
            categoriaID,
            usuarioID,
            imagen: ''
        })

        const {id} = propiedadGuardada
        res.redirect(`/mispropiedades/agregarImagen/${id}`)

    } catch (error) {
        console.log(error)
    }
 
}

const agregarImagen = async (req, res) =>{

    const {id} = req.params

    //Valida que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad){
        return res.redirect('/mispropiedades')
    }

    //Validar que la propiedad no este publicado
    if(propiedad.publicado){
        return res.redirect('/mispropiedades')
    }

    //Valida que la propiedad pertenece al usuario que visita la pagina
    if(req.usuario.id.toString() !== propiedad.usuarioID.toString()){
        return res.redirect('/mispropiedades')
    }

    res.render('mispropiedades/agregarImagen', {
        pagina: `Agregar imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad: propiedad
    })
}

const almacenarImagen = async (req, res, next) =>{
    const {id} = req.params

    //Valida que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad){
        return res.redirect('/mispropiedades')
    }

    //Validar que la propiedad no este publicado
    if(propiedad.publicado){
        return res.redirect('/mispropiedades')
    }

    //Valida que la propiedad pertenece al usuario que visita la pagina
    if(req.usuario.id.toString() !== propiedad.usuarioID.toString()){
        return res.redirect('/mispropiedades')
    }

    try {

        propiedad.imagen = req.file.filename
        propiedad.publicado = 1
        await propiedad.save()
        next()
    } catch (error) {
        console.log(error)
    }
}

const editar = async (req, res) => {

    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mispropiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioID.toString() !== req.usuario.id.toString()){
        return res.redirect('/mispropiedades')
    }

    // Consultar modelo de precio y categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('mispropiedades/editar',{
        pagina: `Editar propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })
}

const guardarCambios = async (req, res ) => {
    
    // Verificar la validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        //Consultar categoriaas y precios
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('mispropiedades/editar',{
            pagina: 'Editar propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    const {id} = req.params

    //Valida que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mispropiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioID.toString() !== req.usuario.id.toString()){
        return res.redirect('/mispropiedades')
    }

    //Reescribir los datos
    try {

        const {titulo, descripcion, habitaciones, estacionamientos, wc, calle, lat, lng, precio: precioID, categoria: categoriaID} = req.body

        propiedad.set({
            titulo,
            descripcion, 
            habitaciones,
            estacionamientos,
            wc,
            calle,
            lat,
            lng,
            precioID,
            categoriaID      
        })

        await propiedad.save();
        res.redirect('/mispropiedades')

    } catch(error) {

    }

}

const eliminar = async (req, res ) => {

    const {id} = req.params

    //Valida que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mispropiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioID.toString() !== req.usuario.id.toString()){
        return res.redirect('/mispropiedades')
    }

    // Eliminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`)

    // Eliminar la propiedad
    await propiedad.destroy()
    res.redirect('/mispropiedades')
}

const cambiarEstado = async (req, res ) => {

    const {id} = req.params

    //Valida que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mispropiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioID.toString() !== req.usuario.id.toString()){
        return res.redirect('/mispropiedades')
    }

    // Actualizar
    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: true
    })
}

const mostrarPropiedad = async (req, res ) => {
    
    const {id} = req.params

    //Valida que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Categoria, as: 'categoria'},
            { model: Precio, as: 'precio'}
        ]
    })

    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404')
    }

    res.render('mispropiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID)
    })

}

const enviarMensaje = async (req, res) => {
    const {id} = req.params

    //Valida que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Categoria, as: 'categoria'},
            { model: Precio, as: 'precio'}
        ]
    })

    if(!propiedad){
        return res.redirect('/404')
    }

    // Renderizar errores
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        //Consultar categoriaas y precios
        return res.render('mispropiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID),
            errores: resultado.array()
        })
    }

    const { mensaje } = req.body
    const { id: propiedadID } = req.params
    const { id: usuarioID } = req.usuario

    console.log( propiedadID )
    console.log( usuarioID )

    await Mensaje.create({
        mensaje,
        propiedadID,
        usuarioID
    })

    res.render('mispropiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID),
        enviado: true
    })

}

// Leer mensajes recibidos
const verMensajes = async ( req, res ) => {
    
    const { id } = req.params

     //Valida que la propiedad exista
     const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes',
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
            }
        ]
    })

     if(!propiedad){
         return res.redirect('/mispropiedades')
     }
 
     // Revisar que quien visita la URL, es quien creo la propiedad
     if(propiedad.usuarioID.toString() !== req.usuario.id.toString()){
         return res.redirect('/mispropiedades')
     }

     res.render('mispropiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
     })
}

export{
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
}