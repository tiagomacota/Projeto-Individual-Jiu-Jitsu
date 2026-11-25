// ============================================================================
// ARQUIVO DO AQUATECH, NÃO É MAIS USADO no TAS | Meu Tatame.
// Ele não está registrado no app.js (as linhas dele foram comentadas lá).
// Foi mantido só como registro/comparação com o projeto original.
// ============================================================================var express = require("express");
var router = express.Router();

var aquarioController = require("../controllers/aquarioController");

router.get("/:empresaId", function (req, res) {
  aquarioController.buscarAquariosPorEmpresa(req, res);
});

router.post("/cadastrar", function (req, res) {
  aquarioController.cadastrar(req, res);
})

module.exports = router;