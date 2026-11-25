var database = require("../database/config");

// Cria o praticante ou atualiza (serve também para TROCAR de perfil)
function salvar(idUsuario, nome, perfil, idade) {
    var instrucaoSql = `
        INSERT INTO praticante (fk_usuario, nome, perfil, dtNascimento)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            nome = VALUES(nome),s
            perfil = VALUES(perfil),
            dtNascimento = VALUES(dtNascimento),
            dtAtualizacao = NOW();
    `;
    return database.executar(instrucaoSql, [idUsuario, nome, perfil, dtNascimento]);
}

function buscar(idUsuario) {
    var instrucaoSql = `
        SELECT fk_usuario AS idUsuario, nome, perfil, idade
        FROM praticante
        WHERE fk_usuario = ?;
    `;
    return database.executar(instrucaoSql, [idUsuario]);
}

module.exports = { salvar, buscar };
