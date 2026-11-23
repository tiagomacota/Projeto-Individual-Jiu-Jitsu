var express = require("express");
var router = express.Router();

var praticanteController = require("../controllers/praticanteController");

router.post("/salvar", function (req, res) {
    praticanteController.salvar(req, res);
});

router.get("/:idUsuario", function (req, res) {
    praticanteController.buscar(req, res);
});

module.exports = router;
