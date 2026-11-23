// ==========================================================================
// PERFIS.JS — regras de negócio do TAS | Meu Tatame
// Os valores dos perfis ficam aqui (em código) e NÃO no banco.
// Assim existe uma única fonte de verdade para a ficha técnica,
// para o cálculo da faixa e para os KPIs da dashboard.
// ==========================================================================

// Ordem das faixas na jornada
var FAIXAS = ["branca", "azul", "roxa", "marrom", "preta"];

// Tempo médio (em meses) para chegar em cada faixa a partir da anterior
// (pesquisa Gold BJJ). A chave é a faixa de DESTINO.
var MESES_BASE = { azul: 28, roxa: 40, marrom: 41, preta: 53 };

// Tempo mínimo da IBJJF (em meses) na faixa que o aluno está DEIXANDO.
// Serve só como referência (selo informativo), não altera nenhum cálculo.
// Chave = faixa de destino: azul→roxa exige 24 m como azul, etc.
var MINIMO_IBJJF_TRANSICAO = { azul: null, roxa: 24, marrom: 18, preta: 12 };

// Mínimo IBJJF acumulado desde o início (para a ficha técnica)
var MINIMO_IBJJF_ACUMULADO = { azul: null, roxa: 24, marrom: 42, preta: 54 };

var PERFIS = {
    leve: {
        nome: "Leve", apelido: "Branca com sono",
        paraQuem: "Quem quer treinar sem pressa e manter a regularidade",
        diasSemana: 2, treinosDia: 1, multTempo: 1.00,
        exigencia: 1, velocidade: 1
    },
    moderado: {
        nome: "Moderado", apelido: "Azul calibrado",
        paraQuem: "Quem quer evoluir de forma constante, conciliando com a rotina",
        diasSemana: 2, treinosDia: 2, multTempo: 0.65,
        exigencia: 2, velocidade: 2
    },
    arduo: {
        nome: "Árduo", apelido: "Orelha estourada",
        paraQuem: "Quem vive o tatame e quer acelerar a graduação",
        diasSemana: 4, treinosDia: 2, multTempo: 0.50,
        exigencia: 3, velocidade: 3
    }
};

function perfilExiste(id) {
    return PERFIS[id] !== undefined;
}

function metaSemanal(id) {
    return PERFIS[id].diasSemana * PERFIS[id].treinosDia;
}

function metaMensal(id) {
    return metaSemanal(id) * 4;
}

// Meses que o perfil leva para ir da faixa anterior até a faixa de destino
function mesesTransicao(id, faixaDestino) {
    return Math.round(MESES_BASE[faixaDestino] * PERFIS[id].multTempo);
}

// Treinos da transição = meses × meta mensal, arredondado para múltiplo de 5
function treinosTransicao(id, faixaDestino) {
    var bruto = mesesTransicao(id, faixaDestino) * metaMensal(id);
    return Math.round(bruto / 5) * 5;
}

// Monta a "ficha técnica" completa de um perfil
function fichaPerfil(id) {
    var p = PERFIS[id];
    var transicoes = [];
    var acumMeses = 0;
    var acumTreinos = 0;

    for (var i = 1; i < FAIXAS.length; i++) {
        var destino = FAIXAS[i];
        var meses = mesesTransicao(id, destino);
        var treinos = treinosTransicao(id, destino);
        var minimo = MINIMO_IBJJF_TRANSICAO[destino];
        acumMeses += meses;
        acumTreinos += treinos;
        transicoes.push({
            faixaOrigem: FAIXAS[i - 1],
            faixaDestino: destino,
            meses: meses,
            treinos: treinos,
            mesesAcumulados: acumMeses,
            treinosAcumulados: acumTreinos,
            minimoIbjjfMeses: minimo,
            minimoIbjjfAcumulado: MINIMO_IBJJF_ACUMULADO[destino],
            abaixoIbjjf: minimo !== null && meses < minimo
        });
    }

    return {
        id: id,
        nome: p.nome,
        apelido: p.apelido,
        paraQuem: p.paraQuem,
        diasSemana: p.diasSemana,
        treinosDia: p.treinosDia,
        metaSemanal: metaSemanal(id),
        metaMensal: metaMensal(id),
        exigencia: p.exigencia,
        velocidade: p.velocidade,
        transicoes: transicoes,
        totalMeses: acumMeses,
        totalAnos: Math.round(acumMeses / 12 * 10) / 10,
        totalTreinos: acumTreinos
    };
}

module.exports = {
    FAIXAS, PERFIS,
    perfilExiste, metaSemanal, metaMensal,
    mesesTransicao, treinosTransicao, fichaPerfil
};
