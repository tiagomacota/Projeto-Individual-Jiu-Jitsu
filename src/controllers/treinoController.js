var praticanteModel = require("../models/praticanteModel");
var treinoModel = require("../models/treinoModel");
var perfis = require("../config/perfis");
var progressao = require("../services/progressao");

// A data de "hoje" pode vir do navegador (?hoje=AAAA-MM-DD), para respeitar o fuso do usuário
function obterHoje(valor) {
    return progressao.dataValida(valor) ? valor : progressao.hojeISO();
}

// POST /treinos/registrar
function registrar(req, res) {
    var idUsuario = req.body.idUsuarioServer;
    var semanaInicio = req.body.semanaInicioServer;
    var treinos = req.body.treinosServer;
    var hoje = obterHoje(req.body.hojeServer);

    if (idUsuario == undefined) {
        res.status(400).send("Seu idUsuario está undefined!");
    } else if (semanaInicio == undefined) {
        res.status(400).send("A semana está undefined!");
    } else if (treinos == undefined || treinos === "") {
        res.status(400).send("A quantidade de treinos está undefined!");
    } else if (!progressao.dataValida(semanaInicio) || !progressao.ehDomingo(semanaInicio)) {
        res.status(400).send("A semana deve começar em um domingo (AAAA-MM-DD)!");
    } else if (semanaInicio > progressao.domingoDaSemana(hoje)) {
        res.status(400).send("Não é possível registrar uma semana futura!");
    } else if (!Number.isInteger(Number(treinos)) || Number(treinos) < 0 || Number(treinos) > 21) {
        res.status(400).send("Treinos deve ser um número inteiro de 0 a 21!");
    } else {
        praticanteModel.buscar(idUsuario)
            .then(function (resultado) {
                if (resultado.length == 0) {
                    res.status(400).send("Escolha um perfil na aba Treino antes de registrar.");
                    return;
                }
                var perfil = resultado[0].perfil;
                // snapshot: guarda o perfil e a meta vigentes no momento do registro
                return treinoModel.registrar(idUsuario, semanaInicio, Number(treinos), perfil, perfis.metaSemanal(perfil))
                    .then(function () {
                        res.json({ mensagem: "Semana registrada com sucesso!" });
                    });
            }).catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

// GET /treinos/semanas/:idUsuario?limite=12
function semanas(req, res) {
    var limite = parseInt(req.query.limite, 10);
    if (isNaN(limite) || limite < 1) limite = 12;
    if (limite > 104) limite = 104;

    treinoModel.listarTodas(req.params.idUsuario)
        .then(function (registros) {
            var ultimas = registros.slice(-limite).map(function (r) {
                return {
                    semanaInicio: r.semana_inicio,
                    treinos: r.treinos_realizados,
                    perfil: r.perfil,
                    metaSemanal: r.meta_semanal
                };
            });
            res.json(ultimas);
        }).catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

// GET /treinos/resumo/:idUsuario?hoje=AAAA-MM-DD
function resumo(req, res) {
    var idUsuario = req.params.idUsuario;
    var hoje = obterHoje(req.query.hoje);

    praticanteModel.buscar(idUsuario)
        .then(function (resultado) {
            if (resultado.length == 0) {
                res.status(404).send("Praticante ainda não escolheu um perfil.");
                return;
            }
            return treinoModel.listarTodas(idUsuario).then(function (registros) {
                res.json(progressao.calcularResumo(resultado[0], registros, hoje));
            });
        }).catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

// GET /treinos/meses/:idUsuario
function meses(req, res) {
    treinoModel.listarTodas(req.params.idUsuario)
        .then(function (registros) {
            res.json(progressao.calcularMeses(registros));
        }).catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = { registrar, semanas, resumo, meses };
