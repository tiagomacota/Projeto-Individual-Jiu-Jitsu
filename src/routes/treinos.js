var express = require("express");
var router = express.Router();

var treinoController = require("../controllers/treinoController");

router.post("/registrar", function (req, res) {
    treinoController.registrar(req, res);
});

router.get("/semanas/:idUsuario", function (req, res) {
    treinoController.semanas(req, res);
});

router.get("/resumo/:idUsuario", function (req, res) {
    treinoController.resumo(req, res);
});

router.get("/meses/:idUsuario", function (req, res) {
    treinoController.meses(req, res);
});

module.exports = router;
