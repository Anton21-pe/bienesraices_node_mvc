import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js"

const protegerRuta = async(req, res, next) => {

    //Verificar si hay token
    const {_token} = req.cookies
    if(!_token){
        return res.redirect('/auth/login')
    }

     //comprobar el token
    try {
        const decoded = jwt.verify(_token, process.env.JWT_WORDSECRET)
        const usuario = await Usuario.scope('eliminarPassword').findByPk(decoded.id)

        if(!usuario){
            return res.redirect('/auth/login')
        }
        req.usuario = usuario
        next();
    } catch (error) {
        return res.clearCookie('_token').redirect('/auth/login')
    } 
    
}

export default protegerRuta