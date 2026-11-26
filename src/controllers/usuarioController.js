var usuarioModel = require("../models/usuarioModel");
// script antigo (AquaTech): var aquarioModel = require("../models/aquarioModel");

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
                    // script antigo (AquaTech): console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`); // transforma JSON em String

                    if (resultadoAutenticar.length == 1) {
                        // script antigo (AquaTech): console.log(resultadoAutenticar);
                        // script antigo (AquaTech):
                        // script antigo (AquaTech): aquarioModel.buscarAquariosPorEmpresa(resultadoAutenticar[0].empresaId)
                        // script antigo (AquaTech):     .then((resultadoAquarios) => {
                        // script antigo (AquaTech):         if (resultadoAquarios.length > 0) {
                        // script antigo (AquaTech):             res.json({
                        // script antigo (AquaTech):                 id: resultadoAutenticar[0].id,
                        // script antigo (AquaTech):                 email: resultadoAutenticar[0].email,
                        // script antigo (AquaTech):                 nome: resultadoAutenticar[0].nome,
                        // script antigo (AquaTech):                 senha: resultadoAutenticar[0].senha,
                        // script antigo (AquaTech):                 aquarios: resultadoAquarios
                        // script antigo (AquaTech):             });
                        // script antigo (AquaTech):         } else {
                        // script antigo (AquaTech):             res.status(204).json({ aquarios: [] });
                        // script antigo (AquaTech):         }
                        // script antigo (AquaTech):     })

                        // Novo: não existe mais aquário; devolve só os dados do usuário (sem a senha)
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
    // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    // script antigo (AquaTech): var fkEmpresa = req.body.idEmpresaVincularServer;
    var username = req.body.usernameServer;

    // Faça as validações dos valores
    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    // script antigo (AquaTech): } else if (fkEmpresa == undefined) {
    // script antigo (AquaTech):     res.status(400).send("Sua empresa a vincular está undefined!");
    } else if (String(senha).length < 8) {
        // Regra nova: senha com 8 caracteres ou mais (vale só para cadastros novos)
        res.status(400).send("A senha deve ter 8 caracteres ou mais!");
    } else if (username == undefined) {
        res.status(400).send("Seu username está undefined!");
    } else {

        // Passe os valores como parâmetro e vá para o arquivo usuarioModel.js
        // script antigo (AquaTech): usuarioModel.cadastrar(nome, email, senha, fkEmpresa)
        usuarioModel.cadastrar(nome, email, senha, username)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    // script antigo (AquaTech): console.log(
                    // script antigo (AquaTech):     "\nHouve um erro ao realizar o cadastro! Erro: ",
                    // script antigo (AquaTech):     erro.sqlMessage
                    // script antigo (AquaTech): );
                    // script antigo (AquaTech): res.status(500).json(erro.sqlMessage);
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
