var usuarioModel = require("../models/usuarioModel");
// script antigo (AquaTech): o login também buscava os aquários da empresa
// var aquarioModel = require("../models/aquarioModel");

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está indefinida!");
    } else {

        usuarioModel.autenticar(email, senha)
            .then(
                function (resultadoAutenticar) {
                    console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);

                    if (resultadoAutenticar.length == 1) {
                         // script antigo (AquaTech): buscava os aquários da empresa e devolvia a lista
                        // aquarioModel.buscarAquariosPorEmpresa(resultadoAutenticar[0].empresaId)
                        //     .then((resultadoAquarios) => {
                        //         if (resultadoAquarios.length > 0) {
                        //             res.json({
                        //                 id: resultadoAutenticar[0].id,
                        //                 email: resultadoAutenticar[0].email,
                        //                 nome: resultadoAutenticar[0].nome,
                        //                 senha: resultadoAutenticar[0].senha,
                        //                 aquarios: resultadoAquarios
                        //             });
                        //         } else {
                        //             res.status(204).json({ aquarios: [] });
                        //         }
                        //     })

                        // script novo (TAS): devolve só os dados do usuário (nunca a senha)
                        res.json({
                            id: resultadoAutenticar[0].id,
                            email: resultadoAutenticar[0].email,
                            nome: resultadoAutenticar[0].nome,
                            username: resultadoAutenticar[0].username
                        });
                    } else if (resultadoAutenticar.length == 0) {
                        res.status(403).send("Email e/ou senha inválido(s)");
                    } else {
                        res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
     // script antigo (AquaTech): var fkEmpresa = req.body.idEmpresaVincularServer;
    // script novo (TAS): o usuário escolhe um username
    var username = req.body.usernameServer;

    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    }  // script antigo (AquaTech):
    // } else if (fkEmpresa == undefined) {
    //     res.status(400).send("Sua empresa a vincular está undefined!");
    // script novo (TAS):
    } else if (username == undefined) {
        res.status(400).send("Seu username está undefined!");
    } else if (String(senha).length < 8) {
        // regra nova: senha com no mínimo 8 caracteres (o front também confere)
        res.status(400).send("A senha precisa ter pelo menos 8 caracteres!");
    } else {
           // script antigo (AquaTech): usuarioModel.cadastrar(nome, email, senha, fkEmpresa)
        // script novo (TAS): o 4º parâmetro agora é o username
        usuarioModel.cadastrar(nome, email, senha, username)
        usuarioModel.cadastrar(nome, email, senha, username)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    if (erro.code == "ER_DUP_ENTRY") {
                        res.status(409).send("E-mail ou username já cadastrado!");
                    } else {
                        res.status(500).json(erro.sqlMessage);
                    }
                }
            );
    }
}

module.exports = {
    autenticar,
    cadastrar
};
