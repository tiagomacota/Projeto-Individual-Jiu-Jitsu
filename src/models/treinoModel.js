var database = require("../database/config");

// Grava o total de treinos de uma semana.
// Se a semana já existe, só atualiza o total (mantém o perfil/meta originais da semana).
function registrar(idUsuario, semanaInicio, treinos, perfil, metaSemanal) {
    var instrucaoSql = `
        INSERT INTO registro_semanal (fk_usuario, semana_inicio, treinos_realizados, perfil, meta_semanal)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            treinos_realizados = VALUES(treinos_realizados),
            dtRegistro = NOW();
    `;
    return database.executar(instrucaoSql, [idUsuario, semanaInicio, treinos, perfil, metaSemanal]);
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

module.exports = { registrar, listarTodas };
