// ==========================================================================
// MURAL.JS — dashboard de progressão (KPIs, gráficos e totem da faixa)
// Depende de: sessao.js, tas-util.js e Chart.js (CDN)
// ==========================================================================

var ID_USUARIO = sessionStorage.ID_USUARIO;
var graficoAproveitamento = null;
var graficoSemanas = null;

// Faltando mais treinos que isso, o KPI mostra "parabéns"; com 10 ou menos, mostra "Faltam X"
var LIMITE_FALTAM = 10;

// Cores dos gráficos (sobre fundo escuro)
var COR_VERDE = "#4caf7a";
var COR_AMARELO = "#e0b341";
var COR_VERMELHO = "#e0525a";
var COR_BARRA = "#dfc187";
var COR_META = "#ED145B";
var COR_TEXTO = "#b5b0a5";
var COR_GRADE = "rgba(255, 255, 255, 0.08)";

function iniciarMural() {
    if (!ID_USUARIO) { limparSessao(); return; }
    var hoje = hojeLocalISO();

    // Os 3 fetches acontecem um depois do outro: resumo -> meses -> semanas
    buscarJSON("/treinos/resumo/" + ID_USUARIO + "?hoje=" + hoje).then(function (respResumo) {
        // 404 = usuário ainda não escolheu perfil
        if (respResumo.status === 404) {
            mural_vazio.style.display = "block";
            return;
        }
        if (!respResumo.ok) {
            mural_vazio.style.display = "block";
            mural_vazio.innerHTML = "Não foi possível carregar o seu progresso. Tente novamente mais tarde.";
            return;
        }
        var resumo = respResumo.dados;

        buscarJSON("/treinos/meses/" + ID_USUARIO).then(function (respMeses) {
            buscarJSON("/treinos/semanas/" + ID_USUARIO + "?limite=60").then(function (respSemanas) {
                mural_conteudo.style.display = "flex";
                desenharCabecalho(resumo);
                desenharKpiFaixa(resumo);
                desenharKpiMeta(resumo);
                desenharKpiComparativo(resumo);
                desenharAproveitamento(respMeses.dados);
                desenharSemanas(respSemanas.dados, resumo.metaSemanal, hoje);
                desenharTotem(resumo);
            });
        });
    }).catch(function (erro) {
        console.log(erro);
        mural_vazio.style.display = "block";
        mural_vazio.innerHTML = "Erro de conexão com o servidor.";
    });
}

// ---------- Cabeçalho ----------
function desenharCabecalho(r) {
    b_usuario.innerHTML = escapar(r.nome);
    var faixa = r.concluido ? "Faixa Preta" : "Faixa " + NOMES_FAIXA[r.faixaAtual];
    subtitulo_mural.innerHTML = '<b>' + escapar(r.nome) + '</b> · ' + faixa +
        ' · Perfil ' + (r.perfil === "arduo" ? "Árduo" : r.perfil.charAt(0).toUpperCase() + r.perfil.slice(1)) +
        ' "' + r.apelido + '" · meta de ' + r.metaSemanal + ' treinos por semana';
}

// ---------- KPI 1: próxima faixa ----------
function desenharKpiFaixa(r) {
    if (r.concluido) {
        kpi_titulo_faixa.innerHTML = "Faixa preta";
        kpi_faltam.innerHTML = "Objetivo alcançado!";
        kpi_barra_faixa.style.width = "100%";
        kpi_leg_atual.innerHTML = "Preta";
        kpi_leg_pct.innerHTML = "100% concluído";
        kpi_leg_prox.innerHTML = "";
        kpi_apoio_faixa.innerHTML = "Você chegou ao fim da jornada. Oss!";
        return;
    }
    kpi_titulo_faixa.innerHTML = "Próxima faixa: " + NOMES_FAIXA[r.proximaFaixa];
    // Longe da próxima faixa: celebra o que já fez. Perto (10 ou menos): mostra quantos faltam.
    if (r.faltam > LIMITE_FALTAM) {
        kpi_faltam.innerHTML = textoParabens(r.treinosNaFaixa);
    } else {
        kpi_faltam.innerHTML = r.faltam === 1 ? "Falta 1 treino" : "Faltam " + numeroBR(r.faltam) + " treinos";
    }
    kpi_barra_faixa.style.width = r.percentual + "%";
    kpi_leg_atual.innerHTML = NOMES_FAIXA[r.faixaAtual] + " (atual)";
    kpi_leg_pct.innerHTML = numeroBR(r.percentual) + "% concluído";
    kpi_leg_prox.innerHTML = NOMES_FAIXA[r.proximaFaixa] + " (próxima)";
    kpi_apoio_faixa.innerHTML = '<b>' + numeroBR(r.treinosNaFaixa) + ' de ' + numeroBR(r.limiteAtual) + '</b> treinos nesta faixa.<br>' +
        'No seu ritmo: ~' + numeroBR(r.mesesRestantes) + ' meses · previsão ' + mesAnoBR(r.dataPrevistaProxima) + '.';
}

// "Você realizou N treinos, parabéns!" (N = treinos feitos na faixa atual)
function textoParabens(n) {
    if (n === 0) return "Registre seu primeiro treino. Oss!";
    return "Você realizou " + numeroBR(n) + (n === 1 ? " treino" : " treinos") + ", parabéns!";
}

// ---------- KPI 2: meta mensal ----------
function desenharKpiMeta(r) {
    var m = r.mesAtual;
    kpi_treinos_mes.innerHTML = m.treinos;
    kpi_meta_mes.innerHTML = m.meta;

    var pct = m.meta > 0 ? m.treinos / m.meta * 100 : 0;
    kpi_barra_meta.style.width = Math.min(100, pct) + "%";
    kpi_barra_meta.className = "barra-preench " + (pct >= 100 ? "verde" : pct >= 60 ? "amarelo" : "vermelho");

    kpi_falta_meta.innerHTML = m.faltam > 0
        ? "Faltam <b>" + m.faltam + "</b> treinos para bater a meta de " + m.rotulo + "."
        : "Meta batida! Excelente disciplina.";
}

// ---------- KPI 3: comparativo com o mês anterior ----------
function desenharKpiComparativo(r) {
    if (!r.mesAnterior) {
        kpi_comp_valor.innerHTML = "—";
        kpi_comp_periodo.innerHTML = "Sem dados do mês anterior";
        kpi_comp_detalhe.innerHTML = "";
        return;
    }
    var v = r.comparativo.variacao;
    var seta = v > 0 ? "&uarr;" : v < 0 ? "&darr;" : "=";
    var sinal = v > 0 ? "+" : "";
    var classe = v > 0 ? "var-positiva" : v < 0 ? "var-negativa" : "";
    var pct = r.comparativo.variacaoPercentual;

    kpi_comp_valor.innerHTML = '<span class="' + classe + '">' + seta + " " + sinal + v +
        (pct !== null ? " (" + sinal + numeroBR(pct) + "%)" : "") + '</span>';
    kpi_comp_periodo.innerHTML = "<b>" + r.mesAtual.rotulo + " vs " + r.mesAnterior.rotulo + "</b>";
    kpi_comp_detalhe.innerHTML = r.mesAtual.treinos + " treinos agora contra " + r.mesAnterior.treinos + " no mês anterior.";
}

// ---------- Barras horizontais: aproveitamento mensal ----------
// Uma barra por mês (o mais recente no topo). A cor segue a regra:
// verde >= 100% · amarelo 60% a 99% · vermelho < 60%
function desenharAproveitamento(dados) {
    var t = dados.totais;
    var lista = dados.meses.slice().reverse();     // mais recente primeiro

    legenda_aproveitamento.innerHTML =
        '<li><span class="quad" style="background:' + COR_VERDE + '"></span>Constante (≥ 100%)<b>' + t.verde + '</b></li>' +
        '<li><span class="quad" style="background:' + COR_AMARELO + '"></span>Médio (60% a 99%)<b>' + t.amarelo + '</b></li>' +
        '<li><span class="quad" style="background:' + COR_VERMELHO + '"></span>Crítico (&lt; 60%)<b>' + t.vermelho + '</b></li>';

    if (lista.length === 0) {
        aproveitamento_area.style.display = "none";
        aproveitamento_vazio.style.display = "block";
        return;
    }

    // a altura cresce com a quantidade de meses (a caixa ao redor rola se ficar muito alta)
    caixa_barras_h.style.height = Math.max(150, lista.length * 38 + 50) + "px";

    var corPorClasse = { verde: COR_VERDE, amarelo: COR_AMARELO, vermelho: COR_VERMELHO };
    var maior = 0;
    lista.forEach(function (m) { if (m.aproveitamento > maior) maior = m.aproveitamento; });

    graficoAproveitamento = new Chart(grafico_aproveitamento.getContext("2d"), {
        type: "bar",
        data: {
            labels: lista.map(function (m) { return m.rotulo; }),
            datasets: [{
                label: "Aproveitamento",
                data: lista.map(function (m) { return m.aproveitamento; }),
                backgroundColor: lista.map(function (m) { return corPorClasse[m.classe]; }),
                borderRadius: 4,
                maxBarThickness: 22
            }]
        },
        options: {
            indexAxis: "y",                       // barras na horizontal
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    suggestedMax: Math.max(110, Math.ceil(maior / 10) * 10 + 10),
                    ticks: { color: COR_TEXTO, callback: function (v) { return v + "%"; } },
                    grid: { color: COR_GRADE }
                },
                y: { ticks: { color: COR_TEXTO }, grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (c) {
                            var m = lista[c.dataIndex];
                            return m.treinos + " de " + m.meta + " treinos (" + numeroBR(m.aproveitamento) + "%)";
                        }
                    }
                }
            }
        }
    });
}

// ---------- Barras: treinos por semana ----------
function desenharSemanas(registros, metaAtual, hoje) {
    var porSemana = {};
    registros.forEach(function (r) { porSemana[r.semanaInicio] = r; });

    var domingoAtual = domingoDe(hoje);
    var rotulos = [], treinos = [], metas = [];
    for (var i = 11; i >= 0; i--) {
        var inicio = somarDiasISO(domingoAtual, -7 * i);
        var reg = porSemana[inicio];
        rotulos.push(diaMesBR(inicio));
        treinos.push(reg ? reg.treinos : null);          // null = semana sem registro
        metas.push(reg ? reg.metaSemanal : metaAtual);
    }

    graficoSemanas = new Chart(grafico_semanas.getContext("2d"), {
        type: "bar",                      // tipo principal; a linha da meta é um dataset com type "line"
        data: {
            labels: rotulos,
            datasets: [
                {
                    type: "bar", label: "Treinos", data: treinos,
                    backgroundColor: COR_BARRA, borderRadius: 3, maxBarThickness: 26,
                    hoverBackgroundColor: "#f5e3bd"
                },
                {
                    type: "line", label: "Meta semanal", data: metas,
                    borderColor: COR_META, borderWidth: 2, borderDash: [6, 4],
                    stepped: true, pointRadius: 0, pointHoverRadius: 4, fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: COR_TEXTO }, grid: { color: COR_GRADE } },
                x: { ticks: { color: COR_TEXTO, maxRotation: 0 }, grid: { display: false },
                     title: { display: true, text: "Início da semana (domingo)", color: COR_TEXTO } }
            },
            plugins: {
                legend: { position: "bottom", labels: { color: "#d1d1d1", usePointStyle: true, boxWidth: 8 } },
                tooltip: {
                    callbacks: {
                        label: function (c) {
                            if (c.parsed.y === null) return "Sem registro";
                            return c.dataset.label + ": " + c.parsed.y;
                        }
                    }
                }
            }
        }
    });
}

// ---------- Totem da faixa ----------
// Um círculo que muda de cor conforme a faixa atual (branca, azul, roxa, marrom, preta)
function desenharTotem(r) {
    totem_circulo.className = "totem-circulo " + r.faixaAtual;
    totem_nome.innerHTML = "Faixa " + NOMES_FAIXA[r.faixaAtual].toLowerCase();
}
