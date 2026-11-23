var perfis = require("../config/perfis");

// GET /perfis — ficha técnica dos 3 perfis
function listar(req, res) {
    var lista = Object.keys(perfis.PERFIS).map(function (id) {
        return perfis.fichaPerfil(id);
    });
    res.json(lista);
}

module.exports = { listar };
