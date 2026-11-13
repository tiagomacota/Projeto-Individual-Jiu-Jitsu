USE Templo;

CREATE TABLE usuario (
id_usuario INT PRIMARY KEY AUTO_INCREMENT,
nome VARCHAR(55),
email VARCHAR(45) UNIQUE,
senha VARCHAR(45), 
username VARCHAR(30) UNIQUE,
dtCadastro DATETIME
);

SELECT * FROM usuario;