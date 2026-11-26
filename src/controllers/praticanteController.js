var praticanteModel = require("../models/praticanteModel");
var treinoModel = require("../models/treinoModel");
var perfis = require("../config/perfis");
var progressao = require("../services/progressao");

// POST /praticantes/salvar
function salvar(req, res) {
    var idUsuario = req.body.idUsuarioServer;
    var nome = req.body.nomeServer;
    var perfil = req.body.perfilServer;
    var dtNascimento = req.body.dtNascimentoServer;

    if (idUsuario == undefined) {
        res.status(400).send("Seu idUsuario está undefined!");
    } else if (nome == undefined || String(nome).trim() == "") {
        res.status(400).send("Seu nome está undefined!");
    } else if (perfil == undefined) {
        res.status(400).send("Seu perfil está undefined!");
    } else if (dtNascimento == undefined) {
        res.status(400).send("Sua data de nascimento está undefined!");
    } else if (!perfis.perfilExiste(perfil)) {
        res.status(400).send("Perfil inválido! Use leve, moderado ou arduo.");
    } else if (!progressao.dataValida(dtNascimento) || dtNascimento < "1900-01-01") {
        res.status(400).send("Data de nascimento inválida!");
    } else if (dtNascimento > progressao.hojeISO()) {
        res.status(400).send("A data de nascimento não pode ser no futuro!");
    } else {
        var nomeLimpo = String(nome).trim().slice(0, 50);
        // já é praticante? então UPDATE (trocar de perfil); se não, INSERT
        praticanteModel.buscar(idUsuario)
            .then(function (resultado) {
                if (resultado.length == 0) {
                    return praticanteModel.cadastrar(idUsuario, nomeLimpo, perfil, dtNascimento);
                } else {
                    return praticanteModel.atualizar(idUsuario, nomeLimpo, perfil, dtNascimento);
                }
            }).then(function () {
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
                    dtNascimento: p.dtNascimento,
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
