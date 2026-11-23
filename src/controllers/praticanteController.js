var praticanteModel = require("../models/praticanteModel");
var treinoModel = require("../models/treinoModel");
var perfis = require("../config/perfis");
var progressao = require("../services/progressao");

// POST /praticantes/salvar
function salvar(req, res) {
    var idUsuario = req.body.idUsuarioServer;
    var nome = req.body.nomeServer;
    var perfil = req.body.perfilServer;
    var idade = req.body.idadeServer;

    if (idUsuario == undefined) {
        res.status(400).send("Seu idUsuario está undefined!");
    } else if (nome == undefined || String(nome).trim() == "") {
        res.status(400).send("Seu nome está undefined!");
    } else if (perfil == undefined) {
        res.status(400).send("Seu perfil está undefined!");
    } else if (idade == undefined) {
        res.status(400).send("Sua idade está undefined!");
    } else if (!perfis.perfilExiste(perfil)) {
        res.status(400).send("Perfil inválido! Use leve, moderado ou arduo.");
    } else if (!Number.isInteger(Number(idade)) || Number(idade) < 1 || Number(idade) > 120) {
        res.status(400).send("Idade inválida! Informe um número inteiro entre 1 e 120.");
    } else {
        praticanteModel.salvar(idUsuario, String(nome).trim().slice(0, 50), perfil, Number(idade))
            .then(function () {
                res.json({ mensagem: "Perfil salvo com sucesso!" });
            }).catch(function (erro) {
                console.log(erro);
                // ER_NO_REFERENCED_ROW_2 = o usuário não existe na tabela usuario
                if (erro.code == "ER_NO_REFERENCED_ROW_2") {
                    res.status(400).send("Usuário não encontrado!");
                } else {
                    res.status(500).json(erro.sqlMessage);
                }
            });
    }
}

// GET /praticantes/:idUsuario
function buscar(req, res) {
    var idUsuario = req.params.idUsuario;

    praticanteModel.buscar(idUsuario)
        .then(function (resultado) {
            if (resultado.length == 0) {
                res.status(404).send("Praticante ainda não escolheu um perfil.");
                return;
            }
            var p = resultado[0];
            return treinoModel.listarTodas(idUsuario).then(function (registros) {
                var faixa = progressao.calcularFaixa(registros);
                res.json({
                    idUsuario: p.idUsuario,
                    nome: p.nome,
                    perfil: p.perfil,
                    idade: p.idade,
                    metaSemanal: perfis.metaSemanal(p.perfil),
                    metaMensal: perfis.metaMensal(p.perfil),
                    faixaAtual: faixa.faixa,
                    fracao: faixa.fracao
                });
            });
        }).catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = { salvar, buscar };
