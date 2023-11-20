const express = require("express");
const fs = require("fs/promises");

const app = express();

const leerReclamos = async () => {
    let reclamos = await fs.readFile(__dirname+"/data/reclamos.json", "utf8");

    //JSON.parse transforma el JSON a un objeto JavaScript
    reclamos = JSON.parse(reclamos);

    return reclamos;



}

//ENDPOINTS DE LA API
app.get("/api/reclamos", async (req, res) => {
    let reclamos = await leerReclamos();
    res.status(200).json({code: 200, message: "Listado de reclamos", reclamos: reclamos.registros});
})


//RUTA COMODÍN -> CUANDO LA RUTA DE CONSULTA NO COINCIDA CON NINGUNA OTRA
app.all("*", (req, res) => {
    res.status(404).json({code: 404, message: "Recurso no encontrado."})
})



module.exports = app;