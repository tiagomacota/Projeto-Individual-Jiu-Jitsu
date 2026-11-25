USE Templo;

CREATE TABLE usuario (
id_usuario INT PRIMARY KEY AUTO_INCREMENT,
nome VARCHAR(55),
email VARCHAR(45) UNIQUE,
senha VARCHAR(45), 
username VARCHAR(30) UNIQUE,
dtCadastro DATETIME
);

-- 1 linha por usuário: perfil escolhido, nome de exibição e idade
CREATE TABLE praticante (
    id_praticante INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    perfil VARCHAR(10) NOT NULL,
    dtNascimento DATE NOT NULL,
    dtAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (fk_usuario) REFERENCES usuario(id_usuario)
);


CREATE TABLE registro_semanal (
    id_registro INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    semana_inicio DATE NOT NULL,          
    treinos_realizados INT NOT NULL,     
    perfil VARCHAR(10) NOT NULL,              
    meta_semanal INT NOT NULL,            
    dtRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_usuario) REFERENCES usuario(id_usuario)
);
