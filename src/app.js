const express = require("express");
const fs = require("fs/promises");
const { randomUUID } = require('node:crypto');
const moment = require("moment");

const app = express();

app.use(express.json()); //guarda los datos en req.body

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

//ENDPOINTS DE LA API

//ENDPOINT LEER RECLAMOS
app.get("/api/reclamos", async (req, res) => {
    let reclamos = await leerReclamos();
    res.status(200).json({code: 200, message: "Listado de reclamos", reclamos: reclamos.registros});
});

app.post("/api/reclamos", async (req, res) => {
    let {autor, email, titulo, mensaje} = req.body;
    let nuevoReclamo = {
        id: randomUUID().slice(0,8),
        fecha: moment().format("DD-MM-YYYY hh:mm a"),
        autor,
        email,
        titulo,
        mensaje,
        estado: "Pendiente"
    };

    await agregarReclamo(nuevoReclamo);
    

    res.status(201).json({code: 201, message: "Reclamo creado correctamente.", reclamo: nuevoReclamo})
});


//RUTA COMODÍN -> CUANDO LA RUTA DE CONSULTA NO COINCIDA CON NINGUNA OTRA
app.all("*", (req, res) => {
    res.status(404).json({code: 404, message: "Recurso no encontrado."})
})



module.exports = app;