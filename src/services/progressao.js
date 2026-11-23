// ==========================================================================
// PROGRESSAO.JS — cálculos de faixa, KPIs e aproveitamento mensal
// Funções puras: recebem dados e devolvem resultado (não acessam o banco).
// Datas trafegam como texto "AAAA-MM-DD" para evitar problema de fuso horário.
// ==========================================================================

var perfis = require("../config/perfis");
var FAIXAS = perfis.FAIXAS;

var MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ---------- Datas ----------

function dataValida(texto) {
    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    var d = new Date(texto + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

// Data de hoje (do servidor) em texto AAAA-MM-DD
function hojeISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + dia;
}

function somarDias(texto, dias) {
    var d = new Date(texto + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
}

function ehDomingo(texto) {
    return new Date(texto + "T00:00:00Z").getUTCDay() === 0;
}

// Domingo que inicia a semana da data informada (semana = domingo a sábado)
function domingoDaSemana(texto) {
    var diaSemana = new Date(texto + "T00:00:00Z").getUTCDay();
    return somarDias(texto, -diaSemana);
}

function chaveMes(texto) { return texto.slice(0, 7); }              // "2026-11"

function rotuloMes(chave) {                                          // "Nov/2026"
    return MESES_ABREV[parseInt(chave.slice(5, 7), 10) - 1] + "/" + chave.slice(0, 4);
}

function mesAnterior(chave) {
    var ano = parseInt(chave.slice(0, 4), 10);
    var mes = parseInt(chave.slice(5, 7), 10) - 1;
    if (mes === 0) { mes = 12; ano--; }
    return ano + "-" + String(mes).padStart(2, "0");
}

// Soma uma quantidade de meses (pode ser decimal) a uma data, devolvendo outra data
function somarMeses(texto, meses) {
    return somarDias(texto, Math.round(meses * 30.44));
}

// ---------- Faixa atual ----------
// registros: [{ semana_inicio, treinos_realizados, perfil }] em ordem cronológica.
// Percorre semana a semana; cada treino "enche" uma fração da faixa,
// medida pela régua do perfil que valia NAQUELA semana.
function calcularFaixa(registros) {
    var fracao = 0;
    var indice = 0;                       // 0 = branca
    var EPS = 1e-9;

    registros.forEach(function (reg) {
        var restante = reg.treinos_realizados;
        while (restante > EPS && indice < FAIXAS.length - 1) {
            var limite = perfis.treinosTransicao(reg.perfil, FAIXAS[indice + 1]);
            var consumo = Math.min(restante / limite, 1 - fracao);
            fracao += consumo;
            restante -= consumo * limite;
            if (fracao >= 1 - EPS) {
                indice++;
                fracao = 0;
            }
        }
    });

    return { faixa: FAIXAS[indice], indice: indice, fracao: fracao };
}

// ---------- Meses (aproveitamento) ----------

// Agrupa as semanas pelo mês do DOMINGO de início.
// Meta do mês = 4 × média das metas semanais registradas (snapshot de cada semana).
function agruparPorMes(registros) {
    var mapa = {};
    registros.forEach(function (reg) {
        var chave = chaveMes(reg.semana_inicio);
        if (!mapa[chave]) mapa[chave] = { treinos: 0, somaMetas: 0, semanas: 0 };
        mapa[chave].treinos += reg.treinos_realizados;
        mapa[chave].somaMetas += reg.meta_semanal;
        mapa[chave].semanas++;
    });
    return mapa;
}

function classificar(aproveitamento) {
    if (aproveitamento >= 100) return "verde";
    if (aproveitamento >= 60) return "amarelo";
    return "vermelho";
}

function calcularMeses(registros) {
    var mapa = agruparPorMes(registros);
    var lista = Object.keys(mapa).sort().map(function (chave) {
        var m = mapa[chave];
        var meta = Math.round(4 * m.somaMetas / m.semanas);
        var aproveitamento = m.treinos / meta * 100;
        return {
            mes: chave,
            rotulo: rotuloMes(chave),
            treinos: m.treinos,
            meta: meta,
            aproveitamento: Math.round(aproveitamento * 10) / 10,
            classe: classificar(aproveitamento)
        };
    });
    var totais = { verde: 0, amarelo: 0, vermelho: 0 };
    lista.forEach(function (m) { totais[m.classe]++; });
    return { meses: lista, totais: totais };
}

// ---------- Resumo (KPIs) ----------
function calcularResumo(praticante, registros, hoje) {
    var perfil = praticante.perfil;
    var metaMensal = perfis.metaMensal(perfil);
    var faixa = calcularFaixa(registros);
    var concluido = faixa.indice === FAIXAS.length - 1;

    // KPI 1 — próxima faixa
    var proxima = concluido ? null : FAIXAS[faixa.indice + 1];
    var limiteAtual = concluido ? 0 : perfis.treinosTransicao(perfil, proxima);
    var treinosNaFaixa = Math.round(faixa.fracao * limiteAtual);
    var faltam = limiteAtual - treinosNaFaixa;
    var mesesRestantes = concluido ? 0 : faltam / metaMensal;

    // Jornada: uma entrada por faixa, sempre pela régua do perfil ATUAL
    var jornada = [];
    var acumuladoMeses = 0;
    FAIXAS.forEach(function (nome, i) {
        var item = { faixa: nome, estado: "futura" };
        if (i < faixa.indice) item.estado = "concluida";
        else if (i === faixa.indice) item.estado = "atual";
        else if (i === faixa.indice + 1) item.estado = "proxima";

        if (i > 0) {
            var treinosEtapa = perfis.treinosTransicao(perfil, nome);
            var mesesEtapa = perfis.mesesTransicao(perfil, nome);
            item.minimoIbjjfMeses = perfis.fichaPerfil(perfil).transicoes[i - 1].minimoIbjjfMeses;
            item.abaixoIbjjf = perfis.fichaPerfil(perfil).transicoes[i - 1].abaixoIbjjf;
            if (item.estado === "proxima") {
                // etapa em andamento: só o que falta
                item.treinos = faltam;
                item.meses = Math.round(mesesRestantes * 10) / 10;
                acumuladoMeses = mesesRestantes;
            } else if (item.estado === "futura") {
                item.treinos = treinosEtapa;
                item.meses = mesesEtapa;
                acumuladoMeses += treinosEtapa / metaMensal;
            }
            if (item.estado === "proxima" || item.estado === "futura") {
                item.dataPrevista = somarMeses(hoje, acumuladoMeses);
            }
        }
        jornada.push(item);
    });
    var itemPreta = jornada[jornada.length - 1];

    // KPIs 2 e 3 — mês atual e comparativo com o mês anterior
    var mapa = agruparPorMes(registros);
    var chaveAtual = chaveMes(hoje);
    var chaveAnt = mesAnterior(chaveAtual);
    var atual = mapa[chaveAtual];
    var metaMes = atual ? Math.round(4 * atual.somaMetas / atual.semanas) : metaMensal;
    var treinosMes = atual ? atual.treinos : 0;

    var mesAnt = mapa[chaveAnt] || null;
    var comparativo = null;
    if (mesAnt) {
        comparativo = {
            variacao: treinosMes - mesAnt.treinos,
            variacaoPercentual: mesAnt.treinos > 0
                ? Math.round((treinosMes - mesAnt.treinos) / mesAnt.treinos * 1000) / 10
                : null
        };
    }

    return {
        nome: praticante.nome,
        idade: praticante.idade,
        perfil: perfil,
        apelido: perfis.PERFIS[perfil].apelido,
        metaSemanal: perfis.metaSemanal(perfil),
        metaMensal: metaMensal,
        faixaAtual: faixa.faixa,
        proximaFaixa: proxima,
        concluido: concluido,
        fracao: faixa.fracao,
        percentual: Math.round(faixa.fracao * 1000) / 10,
        graus: Math.min(4, Math.floor(faixa.fracao / 0.25 + 1e-9)),
        limiteAtual: limiteAtual,
        treinosNaFaixa: treinosNaFaixa,
        faltam: faltam,
        mesesRestantes: Math.round(mesesRestantes * 10) / 10,
        dataPrevistaProxima: concluido ? null : somarMeses(hoje, mesesRestantes),
        dataPrevistaPreta: concluido ? null : itemPreta.dataPrevista,
        mesAtual: {
            rotulo: rotuloMes(chaveAtual), treinos: treinosMes, meta: metaMes,
            faltam: Math.max(0, metaMes - treinosMes)
        },
        mesAnterior: mesAnt ? { rotulo: rotuloMes(chaveAnt), treinos: mesAnt.treinos } : null,
        comparativo: comparativo,
        jornada: jornada,
        totalSemanasRegistradas: registros.length
    };
}

module.exports = {
    dataValida, hojeISO, somarDias, ehDomingo, domingoDaSemana,
    chaveMes, rotuloMes, mesAnterior, somarMeses,
    calcularFaixa, calcularMeses, calcularResumo
};
