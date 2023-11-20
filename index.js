const app = require("./src/app.js")

const PORT = 3000;

(() => {
    console.log("Iniciando servidor.")
    app.listen(PORT, () => console.log("Servidor escuchando en http://localhost:"+PORT));

})();