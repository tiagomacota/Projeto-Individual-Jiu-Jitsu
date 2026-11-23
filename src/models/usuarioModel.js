var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT id_usuario AS id, nome, email, username
        FROM usuario
        WHERE email = ? AND senha = ?;
    `;
    return database.executar(instrucaoSql, [email, senha]);
}

function cadastrar(nome, email, senha, username) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, username, dtCadastro)
        VALUES (?, ?, ?, ?, NOW());
    `;
    return database.executar(instrucaoSql, [nome, email, senha, username]);
}

module.exports = { autenticar, cadastrar };