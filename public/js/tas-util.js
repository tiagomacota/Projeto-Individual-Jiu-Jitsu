// ==========================================================================
// TAS-UTIL.JS — funções de apoio usadas por treino.js e mural.js
// ==========================================================================

var NOMES_FAIXA = { branca: "Branca", azul: "Azul", roxa: "Roxa", marrom: "Marrom", preta: "Preta" };
var MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Faz um GET e devolve { ok, status, dados }
function buscarJSON(url) {
    return fetch(url).then(function (resposta) {
        return resposta.json().catch(function () { return null; }).then(function (dados) {
            return { ok: resposta.ok, status: resposta.status, dados: dados };
        });
    });
}

// ---------- Datas (sempre texto AAAA-MM-DD) ----------

// Data de hoje no relógio do navegador do usuário
function hojeLocalISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function somarDiasISO(texto, dias) {
    var d = new Date(texto + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
}

// Domingo que abre a semana (semana = domingo a sábado)
function domingoDe(texto) {
    return somarDiasISO(texto, -new Date(texto + "T00:00:00Z").getUTCDay());
}

function dataBR(texto) {                 // 2026-11-22 -> 22/11/2026
    return texto.slice(8, 10) + "/" + texto.slice(5, 7) + "/" + texto.slice(0, 4);
}

function diaMesBR(texto) {               // 2026-11-22 -> 22/11
    return texto.slice(8, 10) + "/" + texto.slice(5, 7);
}

function mesAnoBR(texto) {               // 2026-11-22 -> nov/2026
    return MESES_ABREV[parseInt(texto.slice(5, 7), 10) - 1] + "/" + texto.slice(0, 4);
}

// ---------- Números ----------

function numeroBR(n) {                   // 1300 -> 1.300 ; 13.5 -> 13,5
    return Number(n).toLocaleString("pt-BR");
}

// Menos de 36 meses aparece em meses; acima disso, em anos (ex.: 5,7 a)
function tempoBR(meses) {
    if (meses < 36) return numeroBR(Math.round(meses * 10) / 10) + " m";
    return numeroBR(Math.round(meses / 12 * 10) / 10) + " a";
}

// Escapa texto vindo do usuário antes de usar em innerHTML
function escapar(texto) {
    var div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}
