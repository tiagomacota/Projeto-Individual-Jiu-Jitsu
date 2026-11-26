// ==========================================================================
// TREINO.JS — aba Treino: escolha do perfil, dados pessoais e semanas
// Depende de: sessao.js (validarSessao) e tas-util.js
// ==========================================================================

var ID_USUARIO = sessionStorage.ID_USUARIO;
var listaPerfis = [];          // fichas vindas de GET /perfis
var praticante = null;         // dados salvos (null = ainda não escolheu perfil)
var registrosPorSemana = {};   // { "2026-11-15": { treinos, metaSemanal } }
var mostrandoAnteriores = false; // false = só a semana atual; true = semana atual + 4 anteriores
var SEMANAS_ANTERIORES = 4;    // regra do Progresso semanal (o servidor confere de novo)

// ---------- Início ----------
function iniciarTreino() {
    if (!ID_USUARIO) { limparSessao(); return; }

    input_nome.value = sessionStorage.NOME_USUARIO || "";

    // 1º busca os perfis; quando chegarem, busca o praticante (um fetch de cada vez)
    buscarJSON("/perfis").then(function (respPerfis) {
        if (!respPerfis.ok) {
            perfis_grid.innerHTML = '<div class="estado-vazio">Não foi possível carregar os perfis.</div>';
            return;
        }
        listaPerfis = respPerfis.dados;

        buscarJSON("/praticantes/" + ID_USUARIO).then(function (respPraticante) {
            if (respPraticante.ok) {
                praticante = respPraticante.dados;
                input_nome.value = praticante.nome;
                input_nascimento.value = praticante.dtNascimento;
                avisarIdade();
            }
            desenharPerfis();
            atualizarSecaoSemanas();
        });
    }).catch(function (erro) {
        console.log(erro);
        perfis_grid.innerHTML = '<div class="estado-vazio">Erro de conexão com o servidor.</div>';
    });
}

// ---------- Dados pessoais ----------

// Idade em anos a partir da data de nascimento (texto AAAA-MM-DD)
function calcularIdade(nascimento) {
    var hoje = hojeLocalISO();
    var idade = Number(hoje.slice(0, 4)) - Number(nascimento.slice(0, 4));
    if (hoje.slice(5) < nascimento.slice(5)) idade--;      // ainda não fez aniversário este ano
    return idade;
}

// Chamada pelo onkeyup / onchange do campo de nascimento
function avisarIdade() {
    if (input_nascimento.value !== "" && calcularIdade(input_nascimento.value) < 16) {
        msg_idade.className = "msg aviso";
        msg_idade.innerHTML = "Atenção: a IBJJF só reconhece a faixa azul a partir dos 16 anos. Você pode continuar normalmente.";
    } else {
        msg_idade.className = "msg";
        msg_idade.innerHTML = "";
    }
}

// Confere nome e data de nascimento. Devolve true se estiverem corretos.
function validarDados() {
    if (input_nome.value.trim() === "") {
        mostrarMsg(msg_dados, "erro", "Informe o seu nome.");
        input_nome.focus();
        return false;
    }
    if (input_nascimento.value === "") {
        mostrarMsg(msg_dados, "erro", "Informe a sua data de nascimento.");
        input_nascimento.focus();
        return false;
    }
    var idade = calcularIdade(input_nascimento.value);
    if (idade < 1 || idade > 120) {
        mostrarMsg(msg_dados, "erro", "Informe uma data de nascimento válida.");
        input_nascimento.focus();
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

// Frase de cada perfil (o apelido vem do servidor, em p.apelido)
var TEXTO_PROGRESSO = {
    leve: "seu progresso é mais lento",
    moderado: "seu progresso é constante",
    arduo: "seu progresso é acelerado"
};

// Meses acumulados -> anos com 1 casa decimal (28 meses = "2,3 anos")
function anosTexto(mesesAcumulados) {
    var anos = Math.round(mesesAcumulados / 12 * 10) / 10;
    return numeroBR(anos) + (anos === 1 ? " ano" : " anos");
}

// Monta: "você vai demorar ≈ 2,3 anos para a azul, 5,7 para a roxa, 9,1 para a marrom e 13,5 para a preta."
function frasePrazos(transicoes) {
    var partes = [];
    transicoes.forEach(function (t, i) {
        var anos = Math.round(t.mesesAcumulados / 12 * 10) / 10;
        var valor = i === 0 ? "≈ " + anosTexto(t.mesesAcumulados) : numeroBR(anos);
        partes.push(valor + " para a " + NOMES_FAIXA[t.faixaDestino].toLowerCase());
    });
    var ultima = partes.pop();
    return partes.join(", ") + " e " + ultima + ".";
}

function desenharPerfis() {
    var html = "";
    listaPerfis.forEach(function (p) {
        var escolhido = praticante && praticante.perfil === p.id;
        var textoBotao = escolhido ? "Perfil atual" : (praticante ? "Trocar para este perfil" : "Escolher este perfil");

        // bolinhas coloridas das faixas (só como enfeite da progressão)
        var bolinhas = "";
        p.transicoes.forEach(function (t) {
            bolinhas += '<span class="bolinha-faixa ' + t.faixaDestino + '" title="' + NOMES_FAIXA[t.faixaDestino] + '"></span>';
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
                '<div class="ficha-linha"><dt>Meta</dt><dd>' + p.metaSemanal + ' treino' + (p.metaSemanal > 1 ? "s" : "") + ' por semana · ' + p.metaMensal + ' por mês</dd></div>' +
            '</dl>' +
            '<div class="ficha-progressao">' +
                '<div class="progressao-bolinhas">' + bolinhas + '</div>' +
                '<p><b>' + p.apelido + ':</b> ' + TEXTO_PROGRESSO[p.id] + ', você vai demorar ' + frasePrazos(p.transicoes) + '</p>' +
                '<small>Tempo contado desde o início, na faixa branca.</small>' +
            '</div>' +
            '<div class="ref-ibjjf">Referências usadas: IBJJF</div>' +
            '<button class="btn-tas" ' + (escolhido ? "disabled" : "") + ' onclick="escolherPerfil(\'' + p.id + '\')">' + textoBotao + '</button>' +
        '</article>';
    });
    perfis_grid.innerHTML = html;
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
            dtNascimentoServer: input_nascimento.value
        })
    }).then(function (resposta) {
        if (resposta.ok) {
            praticante = { nome: input_nome.value.trim(), perfil: idPerfil, dtNascimento: input_nascimento.value };
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

    buscarJSON("/treinos/semanas/" + ID_USUARIO + "?limite=12").then(function (resp) {
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

var semanasTela = [];   // semanasTela[i] = { inicio: "AAAA-MM-DD", meta: 4 }  (uma linha da tela)

function desenharSemanas() {
    var domingoAtual = domingoDe(hojeLocalISO());
    var html = "";
    semanasTela = [];

    // Só a semana atual; com "Semanas anteriores" aberto, soma as 4 semanas anteriores
    var quantidadeSemanas = mostrandoAnteriores ? 1 + SEMANAS_ANTERIORES : 1;

    for (var i = 0; i < quantidadeSemanas; i++) {
        var inicio = somarDiasISO(domingoAtual, -7 * i);
        var fim = somarDiasISO(inicio, 6);
        var reg = registrosPorSemana[inicio];
        var meta = reg ? reg.metaSemanal : metaDoPerfilAtual();
        var valor = reg ? reg.treinos : "";
        semanasTela.push({ inicio: inicio, meta: meta });

        html += '<div class="semana-linha' + (i === 0 ? " atual" : "") + '">' +
            '<div class="semana-rotulo">Treinos na semana (' + dataBR(inicio) + ' – ' + dataBR(fim) + '):' +
                (i === 0 ? '<span class="tag-atual">Semana atual</span>' : '') + '</div>' +
            '<input type="number" min="0" max="21" id="input_semana_' + i + '" value="' + valor + '" onkeyup="atualizarPercentual(' + i + ')">' +
            '<button class="btn-tas secundario" onclick="salvarSemana(' + i + ')">Salvar</button>' +
            '<div class="semana-meta">— a meta ' + (i === 0 ? "é" : "era") + ' <b>' + meta + '</b> — você bateu <span class="pct" id="pct_semana_' + i + '">' +
                textoPercentual(valor, meta) + '</span><span class="ok-registro" id="ok_semana_' + i + '">' + (reg ? "&#10003; registrado" : "") + '</span></div>' +
            '<div class="semana-aviso msg" id="aviso_semana_' + i + '"></div>' +
        '</div>';
    }
    lista_semanas.innerHTML = html;
    btn_mais_semanas.innerHTML = mostrandoAnteriores ? "Ocultar semanas anteriores" : "Semanas anteriores (últimas " + SEMANAS_ANTERIORES + ")";
}

function textoPercentual(valor, meta) {
    if (valor === "" || meta === 0) return "—";
    return Math.round(Number(valor) / meta * 100) + "%";
}

// Atualiza o "bateu Y%" enquanto o usuário digita (onkeyup do campo da linha i)
function atualizarPercentual(i) {
    document.getElementById("pct_semana_" + i).innerHTML = textoPercentual(document.getElementById("input_semana_" + i).value, semanasTela[i].meta);
}

// Botão "Salvar" da linha i
function salvarSemana(i) {
    var input = document.getElementById("input_semana_" + i);
    var aviso = document.getElementById("aviso_semana_" + i);
    var inicio = semanasTela[i].inicio;
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
            semanaInicioServer: inicio,
            treinosServer: treinos,
            hojeServer: hojeLocalISO()
        })
    }).then(function (resposta) {
        if (resposta.ok) {
            // atualiza a memória local e o texto da linha
            var antigo = registrosPorSemana[inicio];
            registrosPorSemana[inicio] = { treinos: treinos, metaSemanal: antigo ? antigo.metaSemanal : metaDoPerfilAtual() };
            document.getElementById("ok_semana_" + i).innerHTML = "&#10003; registrado";
            mostrarMsg(aviso, "ok", 'Semana salva! <a class="link-mural" href="mural.html">Ver no Mural &rarr;</a>');
        } else {
            resposta.text().then(function (texto) { mostrarMsg(aviso, "erro", escapar(texto)); });
        }
    }).catch(function (erro) {
        console.log(erro);
        mostrarMsg(aviso, "erro", "Erro de conexão com o servidor.");
    });
}

// Botão "Semanas anteriores": abre e fecha a lista das últimas 4 semanas
function alternarSemanasAnteriores() {
    mostrandoAnteriores = !mostrandoAnteriores;
    desenharSemanas();
}
