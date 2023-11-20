const express = require("express");

const app = express();

//ENDPOINTS DE LA API
app.get("/api/reclamos", (req, res) => {
    res.status(200).json({code: 200, message: "Listado de reclamos"});
})


//RUTA COMODÍN -> CUANDO LA RUTA DE CONSULTA NO COINCIDA CON NINGUNA OTRA
app.all("*", (req, res) => {
    res.status(404).json({code: 404, message: "Recurso no encontrado."})
})



module.exports = app;