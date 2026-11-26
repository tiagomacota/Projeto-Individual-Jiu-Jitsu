var database = require("../database/config");

// Procura se a semana já foi registrada (se já foi, o controller faz UPDATE em vez de INSERT)
function buscarSemana(idUsuario, semanaInicio) {
    var instrucaoSql = `
        SELECT id_registro
        FROM registro_semanal
        WHERE fk_usuario = ? AND semana_inicio = ?;
    `;
    return database.executar(instrucaoSql, [idUsuario, semanaInicio]);
}

// Semana nova: grava o total e o perfil/meta da semana (snapshot)
function cadastrar(idUsuario, semanaInicio, treinos, perfil, metaSemanal) {
    var instrucaoSql = `
        INSERT INTO registro_semanal (fk_usuario, semana_inicio, treinos_realizados, perfil, meta_semanal)
        VALUES (?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [idUsuario, semanaInicio, treinos, perfil, metaSemanal]);
}

// Semana existente: só muda o total (mantém o perfil/meta originais da semana)
function atualizar(idUsuario, semanaInicio, treinos) {
    var instrucaoSql = `
        UPDATE registro_semanal
        SET treinos_realizados = ?
        WHERE fk_usuario = ? AND semana_inicio = ?;
    `;
    return database.executar(instrucaoSql, [treinos, idUsuario, semanaInicio]);
}

// Todas as semanas do usuário em ordem cronológica.
// DATE_FORMAT devolve texto (evita o JavaScript mudar a data por causa do fuso).
function listarTodas(idUsuario) {
    var instrucaoSql = `
        SELECT DATE_FORMAT(semana_inicio, '%Y-%m-%d') AS semana_inicio,
               treinos_realizados, perfil, meta_semanal
        FROM registro_semanal
        WHERE fk_usuario = ?
        ORDER BY semana_inicio ASC;
    `;
    return database.executar(instrucaoSql, [idUsuario]);
}

module.exports = { buscarSemana, cadastrar, atualizar, listarTodas };
