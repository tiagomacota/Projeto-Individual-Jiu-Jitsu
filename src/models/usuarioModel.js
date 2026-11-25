var database = require("../database/config");

function autenticar(email, senha) {
      // script antigo (AquaTech): valores colados direto no SQL e busca de empresa
    // console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)
    // var instrucaoSql = `
    //     SELECT id, nome, email, fk_empresa as empresaId FROM usuario WHERE email = '${email}' AND senha = '${senha}';
    // `;
    // console.log("Executando a instrução SQL: \n" + instrucaoSql);
    // return database.executar(instrucaoSql);

    // script novo (TAS): usa ? no lugar de colar o texto; devolve id_usuario e username
    var instrucaoSql = `
        SELECT id_usuario AS id, nome, email, username
        FROM usuario
        WHERE email = ? AND senha = ?;
    `;
    return database.executar(instrucaoSql, [email, senha]);
}

// script antigo (AquaTech): cadastro vinculado a uma empresa
// function cadastrar(nome, email, senha, fkEmpresa) {
//     var instrucaoSql = `
//         INSERT INTO usuario (nome, email, senha, fk_empresa) VALUES ('${nome}', '${email}', '${senha}', '${fkEmpresa}');
//     `;
//     return database.executar(instrucaoSql);
// }

// script novo (TAS): sem empresa; guarda username e a data do cadastro
function cadastrar(nome, email, senha, username) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, username, dtCadastro)
        VALUES (?, ?, ?, ?, NOW());
    `;
    return database.executar(instrucaoSql, [nome, email, senha, username]);
}

module.exports = { autenticar, cadastrar };