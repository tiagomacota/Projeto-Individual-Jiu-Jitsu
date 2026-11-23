-- ==========================================================================
-- TAS | Meu Tatame — tabelas da aba Treino / Mural
-- Execute no banco que o projeto usa (DB_DATABASE do .env.dev, ex.: Templo).
-- Pré-requisito: a tabela usuario (id_usuario INT) já existe.
-- ==========================================================================

USE Templo;

-- 1 linha por usuário: perfil escolhido, nome de exibição e idade
CREATE TABLE praticante (
    id_praticante INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    perfil VARCHAR(10) NOT NULL,
    idade TINYINT NOT NULL,
    dtAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uqPraticanteUsuario UNIQUE (fk_usuario),
    CONSTRAINT fkPraticanteUsuario FOREIGN KEY (fk_usuario) REFERENCES usuario(id_usuario)
);

-- 1 linha por usuário por semana (semana = domingo a sábado)
CREATE TABLE registro_semanal (
    id_registro INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    semana_inicio DATE NOT NULL,              -- sempre um domingo
    treinos_realizados TINYINT NOT NULL,      -- 0 a 21
    perfil VARCHAR(10) NOT NULL,              -- perfil da semana (snapshot)
    meta_semanal TINYINT NOT NULL,            -- meta da semana (snapshot)
    dtRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uqRegistroUsuarioSemana UNIQUE (fk_usuario, semana_inicio),
    CONSTRAINT fkRegistroUsuario FOREIGN KEY (fk_usuario) REFERENCES usuario(id_usuario)
);

-- (Opcional) conferir
-- SELECT * FROM praticante;
-- SELECT * FROM registro_semanal ORDER BY fk_usuario, semana_inicio;
