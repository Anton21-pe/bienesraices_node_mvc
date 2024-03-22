import jwt from "jsonwebtoken"

const generarID = () => Math.random().toString(32).substring(2) + Date.now().toString(32);
const generarJWT = datos => jwt.sign({id: datos.id, nombre: datos.nombre }, process.env.JWT_WORDSECRET, {expiresIn: '1d'})

export {
    generarID,
    generarJWT
}