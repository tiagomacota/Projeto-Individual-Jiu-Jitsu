// ==========================================================================
// TREINO.JS — aba Treino: escolha do perfil, dados pessoais e semanas
// Depende de: sessao.js (validarSessao) e tas-util.js
// ==========================================================================

var ID_USUARIO = sessionStorage.ID_USUARIO;
var listaPerfis = [];          // fichas vindas de GET /perfis
var praticante = null;         // dados salvos (null = ainda não escolheu perfil)
var registrosPorSemana = {};   // { "2026-11-15": { treinos, metaSemanal } }
var quantidadeSemanas = 8;     // quantas semanas aparecem na lista

// ---------- Início ----------
function iniciarTreino() {
    if (!ID_USUARIO) { limparSessao(); return; }

    input_nome.value = sessionStorage.NOME_USUARIO || "";
    input_idade.addEventListener("input", avisarIdade);

    Promise.all([
        buscarJSON("/perfis"),
        buscarJSON("/praticantes/" + ID_USUARIO)
    ]).then(function (respostas) {
        if (!respostas[0].ok) {
            perfis_grid.innerHTML = '<div class="estado-vazio">Não foi possível carregar os perfis.</div>';
            return;
        }
        listaPerfis = respostas[0].dados;
        if (respostas[1].ok) {
            praticante = respostas[1].dados;
            input_nome.value = praticante.nome;
            input_idade.value = praticante.idade;
            avisarIdade();
        }
        desenharPerfis();
        atualizarSecaoSemanas();
    }).catch(function (erro) {
        console.log(erro);
        perfis_grid.innerHTML = '<div class="estado-vazio">Erro de conexão com o servidor.</div>';
    });
}

// ---------- Dados pessoais ----------
function avisarIdade() {
    var idade = Number(input_idade.value);
    if (input_idade.value !== "" && idade > 0 && idade < 16) {
        msg_idade.className = "msg aviso";
        msg_idade.innerHTML = "Atenção: a IBJJF só reconhece a faixa azul a partir dos 16 anos. Você pode continuar normalmente.";
    } else {
        msg_idade.className = "msg";
        msg_idade.innerHTML = "";
    }
}

// Confere nome e idade. Devolve true se estiverem corretos.
function validarDados() {
    var idade = Number(input_idade.value);
    if (input_nome.value.trim() === "") {
        mostrarMsg(msg_dados, "erro", "Informe o seu nome.");
        input_nome.focus();
        return false;
    }
    if (input_idade.value === "" || !Number.isInteger(idade) || idade < 1 || idade > 120) {
        mostrarMsg(msg_dados, "erro", "Informe uma idade válida (número inteiro).");
        input_idade.focus();
        return false;
    }
    return true;
}

function mostrarMsg(elemento, tipo, texto) {
    // troca só a cor da mensagem, mantendo as outras classes do elemento
    elemento.classList.remove("ok", "erro", "aviso");
    elemento.classList.add("msg", tipo);
    elemento.innerHTML = texto;
}

// Botão "Salvar dados": só atualiza nome/idade mantendo o perfil atual
function salvarDados() {
    if (!validarDados()) return;
    if (!praticante) {
        mostrarMsg(msg_dados, "aviso", "Escolha um perfil abaixo para concluir o cadastro.");
        return;
    }
    enviarPerfil(praticante.perfil, msg_dados);
}

// ---------- Escolha do perfil ----------
function desenharPerfis() {
    var html = "";
    listaPerfis.forEach(function (p) {
        var escolhido = praticante && praticante.perfil === p.id;
        var textoBotao = escolhido ? "Perfil atual" : (praticante ? "Trocar para este perfil" : "Escolher este perfil");

        var alertas = "";
        var linhas = "";
        p.transicoes.forEach(function (t) {
            linhas += '<tr>' +
                '<td><span class="bolinha-faixa ' + t.faixaDestino + '"></span>' + NOMES_FAIXA[t.faixaDestino] + '</td>' +
                '<td>' + tempoBR(t.mesesAcumulados) + '</td>' +
                '<td>' + numeroBR(t.treinos) + '</td>' +
                '<td>' + (t.minimoIbjjfAcumulado === null ? "—" : tempoBR(t.minimoIbjjfAcumulado)) + '</td>' +
                '</tr>';
            if (t.abaixoIbjjf) {
                alertas += '<span class="alerta">&#9888; Etapa ' + NOMES_FAIXA[t.faixaOrigem] + ' &rarr; ' + NOMES_FAIXA[t.faixaDestino] +
                    ' (' + t.meses + ' m): abaixo do mínimo IBJJF (' + t.minimoIbjjfMeses + ' m) para competição.</span>';
            }
        });

        html += '<article class="perfil-card' + (escolhido ? " selecionado" : "") + '">' +
            '<div class="perfil-topo">' +
                '<span class="selo">' + (escolhido ? "Seu perfil" : "Perfil") + '</span>' +
                '<h3>' + p.nome + '</h3>' +
                '<div class="perfil-apelido">"' + p.apelido + '"</div>' +
            '</div>' +
            '<p class="perfil-para-quem">' + p.paraQuem + '</p>' +
            '<dl class="ficha">' +
                '<div class="ficha-linha"><dt>Rotina</dt><dd>' + p.diasSemana + ' dias por semana · ' + p.treinosDia + ' treino' + (p.treinosDia > 1 ? "s" : "") + ' por dia</dd></div>' +
                '<div class="ficha-linha"><dt>Meta</dt><dd>' + p.metaSemanal + ' por semana · ' + p.metaMensal + ' por mês</dd></div>' +
                '<div class="ficha-linha"><dt>Exigência</dt><dd>' + barras(p.exigencia) + p.exigencia + ' de 3</dd></div>' +
                '<div class="ficha-linha"><dt>Velocidade</dt><dd>' + barras(p.velocidade) + p.velocidade + ' de 3</dd></div>' +
            '</dl>' +
            '<table class="ficha-faixas">' +
                '<thead><tr><th>Faixa</th><th>Tempo (acum.)</th><th>Treinos (etapa)</th><th>IBJJF mín.</th></tr></thead>' +
                '<tbody>' + linhas + '</tbody>' +
            '</table>' +
            '<div class="ficha-total">&asymp; ' + numeroBR(p.totalTreinos) + ' treinos · ' + numeroBR(p.totalAnos) + ' anos até a preta</div>' +
            '<div class="selo-ibjjf">Referência IBJJF: faixa branca sem tempo mínimo; mínimo de 54 meses até a preta e idade mínima de 19 anos. Apenas informativo, não altera os cálculos.' + alertas + '</div>' +
            '<button class="btn-tas" ' + (escolhido ? "disabled" : "") + ' onclick="escolherPerfil(\'' + p.id + '\')">' + textoBotao + '</button>' +
        '</article>';
    });
    perfis_grid.innerHTML = html;
}

function barras(nivel) {
    var html = '<span class="barras">';
    for (var i = 1; i <= 3; i++) html += '<i class="' + (i <= nivel ? "on" : "") + '"></i>';
    return html + '</span>';
}

function escolherPerfil(idPerfil) {
    if (!validarDados()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }
    enviarPerfil(idPerfil, msg_perfil);
}

// Envia nome, idade e perfil para a API (serve para escolher e para trocar)
function enviarPerfil(idPerfil, elementoMsg) {
    var primeiraVez = !praticante;

    fetch("/praticantes/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            idUsuarioServer: ID_USUARIO,
            nomeServer: input_nome.value.trim(),
            perfilServer: idPerfil,
            idadeServer: Number(input_idade.value)
        })
    }).then(function (resposta) {
        if (resposta.ok) {
            praticante = { nome: input_nome.value.trim(), perfil: idPerfil, idade: Number(input_idade.value) };
            sessionStorage.NOME_USUARIO = praticante.nome;
            b_usuario.innerHTML = escapar(praticante.nome);
            desenharPerfis();
            atualizarSecaoSemanas();
            mostrarMsg(elementoMsg, "ok", primeiraVez
                ? "Perfil escolhido! Agora registre seus treinos na seção 3."
                : "Dados atualizados! O progresso que você já fez foi mantido.");
        } else {
            resposta.text().then(function (texto) { mostrarMsg(elementoMsg, "erro", escapar(texto)); });
        }
    }).catch(function (erro) {
        console.log(erro);
        mostrarMsg(elementoMsg, "erro", "Erro de conexão com o servidor.");
    });
}

// ---------- Semanas ----------
function atualizarSecaoSemanas() {
    if (!praticante) {
        secao_semanas.style.display = "none";
        return;
    }
    secao_semanas.style.display = "block";

    buscarJSON("/treinos/semanas/" + ID_USUARIO + "?limite=104").then(function (resp) {
        registrosPorSemana = {};
        if (resp.ok) {
            resp.dados.forEach(function (r) {
                registrosPorSemana[r.semanaInicio] = { treinos: r.treinos, metaSemanal: r.metaSemanal };
            });
        }
        desenharSemanas();
    });
}

function metaDoPerfilAtual() {
    for (var i = 0; i < listaPerfis.length; i++) {
        if (listaPerfis[i].id === praticante.perfil) return listaPerfis[i].metaSemanal;
    }
    return 0;
}

function desenharSemanas() {
    var domingoAtual = domingoDe(hojeLocalISO());
    var html = "";

    for (var i = 0; i < quantidadeSemanas; i++) {
        var inicio = somarDiasISO(domingoAtual, -7 * i);
        var fim = somarDiasISO(inicio, 6);
        var reg = registrosPorSemana[inicio];
        var meta = reg ? reg.metaSemanal : metaDoPerfilAtual();
        var valor = reg ? reg.treinos : "";

        html += '<div class="semana-linha' + (i === 0 ? " atual" : "") + '" data-inicio="' + inicio + '" data-meta="' + meta + '">' +
            '<div class="semana-rotulo">Treinos na semana (' + dataBR(inicio) + ' – ' + dataBR(fim) + '):' +
                (i === 0 ? '<span class="tag-atual">Semana atual</span>' : '') + '</div>' +
            '<input type="number" min="0" max="21" value="' + valor + '" oninput="atualizarPercentual(this)">' +
            '<button class="btn-tas secundario" onclick="salvarSemana(this)">Salvar</button>' +
            '<div class="semana-meta">— a meta ' + (i === 0 ? "é" : "era") + ' <b>' + meta + '</b> — você bateu <span class="pct">' +
                textoPercentual(valor, meta) + '</span><span class="ok-registro">' + (reg ? "&#10003; registrado" : "") + '</span></div>' +
            '<div class="semana-aviso msg"></div>' +
        '</div>';
    }
    lista_semanas.innerHTML = html;
    btn_mais_semanas.style.display = quantidadeSemanas >= 52 ? "none" : "inline-block";
}

function textoPercentual(valor, meta) {
    if (valor === "" || meta === 0) return "—";
    return Math.round(Number(valor) / meta * 100) + "%";
}

// Atualiza o "bateu Y%" enquanto o usuário digita
function atualizarPercentual(input) {
    var linha = input.parentElement;
    linha.querySelector(".pct").innerHTML = textoPercentual(input.value, Number(linha.dataset.meta));
}

function salvarSemana(botao) {
    var linha = botao.parentElement;
    var input = linha.querySelector("input");
    var aviso = linha.querySelector(".semana-aviso");
    var treinos = Number(input.value);

    if (input.value === "" || !Number.isInteger(treinos) || treinos < 0 || treinos > 21) {
        mostrarMsg(aviso, "erro", "Informe um número inteiro de 0 a 21.");
        return;
    }

    fetch("/treinos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            idUsuarioServer: ID_USUARIO,
            semanaInicioServer: linha.dataset.inicio,
            treinosServer: treinos,
            hojeServer: hojeLocalISO()
        })
    }).then(function (resposta) {
        if (resposta.ok) {
            // atualiza a memória local e o texto da linha
            var antigo = registrosPorSemana[linha.dataset.inicio];
            registrosPorSemana[linha.dataset.inicio] = { treinos: treinos, metaSemanal: antigo ? antigo.metaSemanal : metaDoPerfilAtual() };
            linha.querySelector(".ok-registro").innerHTML = "&#10003; registrado";
            mostrarMsg(aviso, "ok", 'Semana salva! <a class="link-mural" href="mural.html">Ver no Mural &rarr;</a>');
        } else {
            resposta.text().then(function (texto) { mostrarMsg(aviso, "erro", escapar(texto)); });
        }
    }).catch(function (erro) {
        console.log(erro);
        mostrarMsg(aviso, "erro", "Erro de conexão com o servidor.");
    });
}

function mostrarMaisSemanas() {
    quantidadeSemanas = Math.min(52, quantidadeSemanas + 4);
    desenharSemanas();
}
