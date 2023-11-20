const express = require("express");
const fs = require("fs/promises");
const { randomUUID } = require('node:crypto');
const moment = require("moment");
const cors = require("cors");
const morgan = require("morgan");
const { create } = require("express-handlebars");
const path = require("path");

const app = express();

app.use(cors()); //acepta peticiones de origines cruzados

app.use(express.json()); //guarda los datos en req.body

app.use(morgan("tiny"));


//INICIO CONFIGURACIÓN HANDLEBARS

const hbs = create({
	partialsDir: [
		path.resolve(__dirname, "./views/partials"),
	],
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname, "./views"));

//FIN CONFIGURACIÓN HANDLEBARS

const leerReclamos = async () => {
    let reclamos = await fs.readFile(__dirname+"/data/reclamos.json", "utf8");

    //JSON.parse transforma el JSON a un objeto JavaScript
    reclamos = JSON.parse(reclamos);
    return reclamos;
};

const agregarReclamo = async (reclamo) => {
    let reclamos = await leerReclamos();
    reclamos.registros.push(reclamo);
    await fs.writeFile(__dirname+"/data/reclamos.json", JSON.stringify(reclamos, null, 2), "utf8");
}


//RUTAS PARA VISTAS
//PÁGINA PRINCIPAL
app.get(["/", "/home"], (req, res) => {
    res.render("home");
});

//PÁGINA RECLAMOS
app.get("/reclamos", (req, res) => {
    res.render("reclamos");
});



//ENDPOINTS DE LA API

//ENDPOINT LEER RECLAMOS
app.get("/api/reclamos", async (req, res) => {
    let reclamos = await leerReclamos();
    res.status(200).json({code: 200, message: "Listado de reclamos", reclamos: reclamos.registros});
});

//ENDPOINT QUE PERMITE CREAR CREAMOS
app.post("/api/reclamos", async (req, res) => {
    let {autor, email, titulo, mensaje} = req.body;
    let nuevoReclamo = {
        id: randomUUID().slice(0,8),
        fecha: moment().format("DD-MM-YYYY hh:mm a"),
        autor,
        email,
        titulo,
        mensaje,
        estado: "Pendiente",
        respuesta: ""
    };

    await agregarReclamo(nuevoReclamo);
    

    res.status(201).json({code: 201, message: "Reclamo creado correctamente.", reclamo: nuevoReclamo})
});


//RUTA COMODÍN -> CUANDO LA RUTA DE CONSULTA NO COINCIDA CON NINGUNA OTRA
app.all("*", (req, res) => {
    res.status(404).json({code: 404, message: "Recurso no encontrado."})
})



module.exports = app;