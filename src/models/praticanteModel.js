var database = require("../database/config");

// Procura o praticante do usuário. A idade é calculada no próprio SELECT.
function buscar(idUsuario) {
    var instrucaoSql = `
        SELECT fk_usuario AS idUsuario, nome, perfil,
               DATE_FORMAT(dtNascimento, '%Y-%m-%d') AS dtNascimento,
               TIMESTAMPDIFF(YEAR, dtNascimento, CURDATE()) AS idade
        FROM praticante
        WHERE fk_usuario = ?;
    `;
    return database.executar(instrucaoSql, [idUsuario]);
}

// Primeira vez que o usuário escolhe um perfil
function cadastrar(idUsuario, nome, perfil, dtNascimento) {
    var instrucaoSql = `
        INSERT INTO praticante (fk_usuario, nome, perfil, dtNascimento)
        VALUES (?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [idUsuario, nome, perfil, dtNascimento]);
}

// Já existe: serve para trocar de perfil ou corrigir nome/nascimento
function atualizar(idUsuario, nome, perfil, dtNascimento) {
    var instrucaoSql = `
        UPDATE praticante
        SET nome = ?, perfil = ?, dtNascimento = ?
        WHERE fk_usuario = ?;
    `;
    return database.executar(instrucaoSql, [nome, perfil, dtNascimento, idUsuario]);
}

module.exports = { buscar, cadastrar, atualizar };
