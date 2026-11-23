// ==========================================================================
// MURAL.JS — dashboard de progressão (KPIs, gráficos e jornada das faixas)
// Depende de: sessao.js, tas-util.js e Chart.js (CDN)
// ==========================================================================

var ID_USUARIO = sessionStorage.ID_USUARIO;
var graficoRosca = null;
var graficoSemanas = null;

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

    Promise.all([
        buscarJSON("/treinos/resumo/" + ID_USUARIO + "?hoje=" + hoje),
        buscarJSON("/treinos/meses/" + ID_USUARIO),
        buscarJSON("/treinos/semanas/" + ID_USUARIO + "?limite=60"),
        buscarJSON("/perfis")
    ]).then(function (r) {
        // 404 = usuário ainda não escolheu perfil
        if (r[0].status === 404) {
            mural_vazio.style.display = "block";
            return;
        }
        if (!r[0].ok) {
            mural_vazio.style.display = "block";
            mural_vazio.innerHTML = "Não foi possível carregar o seu progresso. Tente novamente mais tarde.";
            return;
        }
        mural_conteudo.style.display = "flex";

        var resumo = r[0].dados;
        desenharCabecalho(resumo);
        desenharKpiFaixa(resumo);
        desenharKpiMeta(resumo);
        desenharKpiComparativo(resumo);
        desenharRosca(r[1].dados);
        desenharSemanas(r[2].dados, resumo.metaSemanal, hoje);
        desenharJornada(resumo);
        if (r[3].ok) desenharComparativoPerfis(r[3].dados, resumo.perfil);
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
    kpi_faltam.innerHTML = "Faltam " + numeroBR(r.faltam) + " treinos";
    kpi_barra_faixa.style.width = r.percentual + "%";
    kpi_leg_atual.innerHTML = NOMES_FAIXA[r.faixaAtual] + " (atual)";
    kpi_leg_pct.innerHTML = numeroBR(r.percentual) + "% concluído";
    kpi_leg_prox.innerHTML = NOMES_FAIXA[r.proximaFaixa] + " (próxima)";
    kpi_apoio_faixa.innerHTML = '<b>' + numeroBR(r.treinosNaFaixa) + ' de ' + numeroBR(r.limiteAtual) + '</b> treinos nesta faixa.<br>' +
        'No seu ritmo: ~' + numeroBR(r.mesesRestantes) + ' meses · previsão ' + mesAnoBR(r.dataPrevistaProxima) +
        '<br>Faixa preta: previsão ' + mesAnoBR(r.dataPrevistaPreta) + '.';
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

// ---------- Rosquinha: aproveitamento mensal ----------
function desenharRosca(dados) {
    var t = dados.totais;
    var total = t.verde + t.amarelo + t.vermelho;

    legenda_rosca.innerHTML =
        '<li><span class="quad" style="background:' + COR_VERDE + '"></span>Constante (≥ 100%)<b>' + t.verde + '</b></li>' +
        '<li><span class="quad" style="background:' + COR_AMARELO + '"></span>Médio (60% a 99%)<b>' + t.amarelo + '</b></li>' +
        '<li><span class="quad" style="background:' + COR_VERMELHO + '"></span>Crítico (&lt; 60%)<b>' + t.vermelho + '</b></li>';

    if (total === 0) {
        document.querySelector(".rosca-area").style.display = "none";
        rosca_vazio.style.display = "block";
        return;
    }

    graficoRosca = new Chart(grafico_rosca.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Constante", "Médio", "Crítico"],
            datasets: [{
                data: [t.verde, t.amarelo, t.vermelho],
                backgroundColor: [COR_VERDE, COR_AMARELO, COR_VERMELHO],
                borderColor: "#0f0f0f",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (c) { return c.label + ": " + c.parsed + (c.parsed === 1 ? " mês" : " meses"); }
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

// ---------- Jornada das faixas ----------
var TEXTO_ESTADO = { concluida: "Concluída", atual: "Faixa atual", proxima: "Próxima", futura: "Futura" };

function desenharJornada(r) {
    jornada_sub.innerHTML = "perfil " + r.apelido;
    var html = "";

    r.jornada.forEach(function (f, i) {
        var nome = NOMES_FAIXA[f.faixa];

        // Linha conectora antes de cada faixa (menos a primeira)
        if (i > 0) {
            var anterior = r.jornada[i - 1];
            var classeLinha = "conector futuro";
            if (anterior.estado === "concluida") classeLinha = "conector";
            else if (anterior.estado === "atual") classeLinha = "conector parcial";
            html += '<div class="' + classeLinha + '" style="--pct:' + r.percentual + '"></div>';
        }

        // Texto informativo de cada estado
        var info = "";
        if (f.estado === "concluida") {
            info = "&#10003; Conquistada";
        } else if (f.estado === "atual") {
            info = r.concluido ? "Objetivo alcançado!" : "Faltam " + numeroBR(r.faltam) + " treinos · ~" + numeroBR(r.mesesRestantes) + " meses";
        } else if (f.estado === "proxima") {
            info = numeroBR(f.treinos) + " treinos restantes";
        } else {
            info = numeroBR(f.treinos) + " treinos · ~" + numeroBR(f.meses) + " meses";
        }

        var data = f.dataPrevista ? '<div class="faixa-data">previsão ' + mesAnoBR(f.dataPrevista) + '</div>' : "";

        var selo = "";
        if (f.minimoIbjjfMeses) {
            selo = '<span class="selo-ibjjf-mini' + (f.abaixoIbjjf ? " alerta" : "") + '">IBJJF mín. ' + f.minimoIbjjfMeses + ' m' +
                (f.abaixoIbjjf ? " &#9888;" : "") + '</span>';
        }

        var graus = "";
        if (f.estado === "atual" && !r.concluido) {
            graus = '<div class="graus" title="Graus: acendem a cada 25% da faixa">';
            for (var g = 1; g <= 4; g++) graus += '<i class="' + (g <= r.graus ? "on" : "") + '"></i>';
            graus += '</div>';
        }

        var tooltip = montarTooltip(f, r);

        html += '<div class="no-faixa ' + f.estado + '" tabindex="0" style="--pct:' + r.percentual + '">' +
            (f.estado === "atual" ? '<span class="marcador-aqui">Você está aqui</span>' : "") +
            '<div class="anel"><div class="faixa-cor ' + f.faixa + '">' + (f.estado === "atual" && !r.concluido ? Math.round(r.percentual) + "%" : "") + '</div></div>' +
            '<div class="faixa-nome">' + nome + '</div>' +
            '<div class="faixa-status">' + TEXTO_ESTADO[f.estado] + '</div>' +
            graus +
            '<div class="faixa-info">' + info + '</div>' + data + selo +
            '<div class="tooltip-faixa">' + tooltip + '</div>' +
        '</div>';
    });

    jornada.innerHTML = html;
}

function montarTooltip(f, r) {
    var t = "<b>Faixa " + NOMES_FAIXA[f.faixa] + "</b><br>";
    if (f.estado === "concluida") return t + "Você já conquistou esta faixa.";
    if (f.estado === "atual") {
        if (r.concluido) return t + "Fim da jornada. Parabéns!";
        return t + numeroBR(r.treinosNaFaixa) + " de " + numeroBR(r.limiteAtual) + " treinos para a próxima faixa (" + numeroBR(r.percentual) + "%).";
    }
    if (f.estado === "proxima") t += "Faltam " + numeroBR(f.treinos) + " treinos (~" + numeroBR(f.meses) + " meses).<br>";
    else t += numeroBR(f.treinos) + " treinos nesta etapa (~" + numeroBR(f.meses) + " meses).<br>";
    t += "Previsão de chegada: " + mesAnoBR(f.dataPrevista) + ".";
    if (f.minimoIbjjfMeses) {
        t += "<br>Referência IBJJF: mínimo de " + f.minimoIbjjfMeses + " meses na faixa anterior" +
            (f.abaixoIbjjf ? " (o seu perfil fica abaixo disso)" : "") + ".";
    }
    return t;
}

// ---------- Comparativo dos perfis ----------
function desenharComparativoPerfis(perfis, meuPerfil) {
    var maior = 0;
    perfis.forEach(function (p) { if (p.totalMeses > maior) maior = p.totalMeses; });

    var html = "";
    perfis.forEach(function (p) {
        html += '<div class="comp-linha' + (p.id === meuPerfil ? " meu" : "") + '">' +
            '<div class="comp-nome"><b>' + p.nome + '</b><span>"' + p.apelido + '"</span></div>' +
            '<div class="comp-barra"><div style="width:' + (p.totalMeses / maior * 100) + '%"></div></div>' +
            '<div class="comp-valor">' + numeroBR(p.totalAnos) + ' anos · ' + numeroBR(p.totalTreinos) + ' treinos</div>' +
        '</div>';
    });
    comparativo_perfis.innerHTML = html;
}
