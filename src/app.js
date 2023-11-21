const express = require("express");
const fs = require("fs/promises");
const { randomUUID } = require('node:crypto');
const moment = require("moment");
const cors = require("cors");
const morgan = require("morgan");
const { create } = require("express-handlebars");
const path = require("path");

const app = express();

//CONFIGURACIÓN DE MIDDLEWARES
app.use(cors()); //acepta peticiones de origenes cruzados

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


const editarReclamo = async (reclamo) => {
    let reclamos = await leerReclamos();

    reclamos.registros = reclamos.registros.map(element => {
        if(element.id == reclamo.id){
            element.estado = reclamo.estado;
            element.respuesta = reclamo.respuesta;
        }
        return element
    })
    

    await fs.writeFile(__dirname+"/data/reclamos.json", JSON.stringify(reclamos, null, 2), "utf8");
}



const eliminarReclamo = async (id) => {
    let reclamos = await leerReclamos();

    reclamos.registros = reclamos.registros.filter(reclamo => reclamo.id != id);
    
    await fs.writeFile(__dirname+"/data/reclamos.json", JSON.stringify(reclamos, null, 2), "utf8");
}

//RUTAS PARA VISTAS
//PÁGINA PRINCIPAL
app.get(["/", "/home"], (req, res) => {
    res.render("home", {
        homeView: true
    });
});

//PÁGINA RECLAMOS
app.get("/reclamos", (req, res) => {
    res.render("reclamos", {
        reclamosView: true
    });
});

//PÁGINA RECLAMOS CON FILTRO POR ID
app.get("/reclamos/:id", async (req, res) => {
    let {id} = req.params;
    let reclamos = await leerReclamos();

    let reclamoFind = reclamos.registros.find(reclamo => reclamo.id == id);

    if(reclamoFind){
        res.render("detalleReclamo", {
            reclamo: reclamoFind,
            dashboardView: true
        });
    }else{
        res.render("detalleReclamo", {
            error: "No se encuentra el reclamo indicado.",
            dashboardView: true
        });
    }
  
});

//PÁGINA DASHBOARD RECLAMOS
app.get("/dashboard/reclamos", async (req, res) => {
    let reclamos = await leerReclamos();

    res.render("dashboardReclamos", {
        reclamos: reclamos.registros,
        dashboardView: true
    });
});





//ENDPOINTS DE LA API

//ENDPOINT LEER RECLAMOS
app.get("/api/reclamos", async (req, res) => {
    let reclamos = await leerReclamos();
    res.json({code: 200, message: "Listado de reclamos", reclamos: reclamos.registros});
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

//RUTA PARA ACTUALIZAR RECLAMOS CON UN ESTADO Y RESPUESTA
app.put("/api/reclamos", async (req, res) => {
    let {id, estado, respuesta} = req.body;
    let reclamos = await leerReclamos();

    let reclamoFind = reclamos.registros.find(reclamo => reclamo.id == id);

    if(reclamoFind){
        reclamoFind.estado = estado;
        reclamoFind.respuesta = respuesta;
        await editarReclamo(reclamoFind);
        res.status(201).json({code: 201, message: "Reclamo actualizado con éxito."})
    }else {
        res.status(404).json({code: 404, message: "ID de reclamo no encontrado."});
    }
});

const validarExistenciaReclamo = async (req, res, next) => {
    let reclamos = await leerReclamos();
    let {id} = req.query;

    let reclamoFind = reclamos.registros.find(reclamo => reclamo.id == id);

    if(reclamoFind){
        if(reclamoFind.estado.toLowerCase() == "finalizado"){
            req.reclamo = reclamoFind;
          next();  
        }else {
            res.status(400).json({code: 400, message: "El reclamo que intenta eliminar no ha finalizado."});
        }
        
    }
    else{
        res.status(404).json({code: 404, message: "ID de reclamo no encontrado."});
    }
};

//ENDPOINT ELIMINAR RECLAMOS FINALIZADOS CON MIDDLEWARE
app.delete("/api/reclamos", validarExistenciaReclamo, async (req, res) => {
    let { id } = req.reclamo;
    
    await eliminarReclamo(id);

    res.status(200).json({code: 200, message: "Reclamo eliminado con éxito."})
});



//RUTA COMODÍN -> CUANDO LA RUTA DE CONSULTA NO COINCIDA CON NINGUNA OTRA
app.all("*", (req, res) => {
    res.status(404).json({code: 404, message: "Recurso no encontrado."})
})



module.exports = app;