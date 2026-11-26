// ==========================================================================
// LOGIN.JS — tela de login (antes ficava dentro do <script> do login.html)
// Depende de: sessao.js (aguardar e finalizarAguardar)
//
// REGRA NOVA: no máximo 4 tentativas erradas.
//  - VETOR  -> "tentativas" guarda o histórico das tentativas erradas
//              (número + mensagem). A senha digitada NUNCA é guardada.
//  - FOR    -> a função mostrarHistorico() percorre o vetor para montar
//              a mensagem "Tentativa 2 de 4..." e contar quantas restam.
//  - Depois da 4ª tentativa o botão fica travado por alguns segundos.
//
// LIMITE HONESTO: esse bloqueio vive no navegador, então quem limpar os dados
// do site consegue burlar. Para valer de verdade, teria de ser feito no servidor.
// ==========================================================================

var MAX_TENTATIVAS = 4;               // máximo de tentativas erradas
var TEMPO_BLOQUEIO_SEGUNDOS = 30;     // tempo de espera depois da 4ª tentativa

var tentativas = [];                  // <-- VETOR do histórico: [{ numero: 1, mensagem: "..." }, ...]

// Guardamos o vetor e o fim do bloqueio na sessão do navegador para o F5 não zerar a conta
var CHAVE_TENTATIVAS = "TAS_LOGIN_TENTATIVAS";
var CHAVE_BLOQUEIO = "TAS_LOGIN_BLOQUEIO_ATE";

// ---------- Início: recupera o que já foi tentado ----------
function iniciarLogin() {
    try {
        tentativas = JSON.parse(sessionStorage.getItem(CHAVE_TENTATIVAS)) || [];
    } catch (erro) {
        tentativas = [];
    }

    var ate = Number(sessionStorage.getItem(CHAVE_BLOQUEIO)) || 0;
    if (ate > Date.now()) {
        iniciarBloqueio(ate);               // ainda está bloqueado
    } else if (ate > 0) {
        limparTentativas();                 // o bloqueio já passou: recomeça do zero
    } else if (tentativas.length > 0) {
        mostrarHistorico();
    }
}

function entrar() {
    if (btn_entrar.style.display == "none") return false;      // bloqueado: não faz nada

    aguardar();

    var emailVar = email_input.value;
    var senhaVar = senha_input.value;

    if (emailVar == "" || senhaVar == "") {
        cardErro.style.display = "block"
        // script antigo (AquaTech): mensagem_erro.innerHTML = "(Mensagem de erro para todos os campos em branco)";
        mensagem_erro.innerHTML = "Preencha o e-mail e a senha!";
        finalizarAguardar();
        // campo vazio não gasta tentativa: nem chegou a falar com o servidor
        setTimeout(sumirMensagem, 5000);
        return false;
    }
    // script antigo (AquaTech): else {
    // script antigo (AquaTech):     setInterval(sumirMensagem, 5000)
    // script antigo (AquaTech): }

    // script antigo (AquaTech): console.log("FORM LOGIN: ", emailVar);
    // script antigo (AquaTech): console.log("FORM SENHA: ", senhaVar);
    // (o console.log da senha foi removido: senha não deve aparecer no console)

    fetch("/usuarios/autenticar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            emailServer: emailVar,
            senhaServer: senhaVar
        })
    }).then(function (resposta) {
        console.log("ESTOU NO THEN DO entrar()!")

        if (resposta.ok) {
            console.log(resposta);

            resposta.json().then(json => {
                console.log(json);
                console.log(JSON.stringify(json));
                sessionStorage.EMAIL_USUARIO = json.email;
                sessionStorage.NOME_USUARIO = json.nome;
                sessionStorage.ID_USUARIO = json.id;
                // script antigo (AquaTech): sessionStorage.AQUARIOS = JSON.stringify(json.aquarios)

                limparTentativas();         // acertou: zera o histórico de erros

                setTimeout(function () {
                    // script antigo (AquaTech): window.location = "./dashboard/cards.html";
                    window.location = "./dashboard/bemvindo.html";
                }, 1000); // apenas para exibir o loading

            });

        } else {

            console.log("Houve um erro ao tentar realizar o login!");

            resposta.text().then(texto => {
                console.error(texto);
                // script antigo (AquaTech): finalizarAguardar(texto);
                registrarTentativaErrada(texto);
            });
        }

    }).catch(function (erro) {
        console.log(erro);
        finalizarAguardar("Não foi possível falar com o servidor. Tente de novo.");
    })

    return false;
}

// Coloca a tentativa errada no VETOR e decide se bloqueia
function registrarTentativaErrada(texto) {
    tentativas.push({ numero: tentativas.length + 1, mensagem: texto });   // <-- grava no vetor
    sessionStorage.setItem(CHAVE_TENTATIVAS, JSON.stringify(tentativas));

    mostrarHistorico();

    if (tentativas.length >= MAX_TENTATIVAS) {
        var ate = Date.now() + TEMPO_BLOQUEIO_SEGUNDOS * 1000;
        sessionStorage.setItem(CHAVE_BLOQUEIO, String(ate));
        iniciarBloqueio(ate);
    }
}

// Percorre o vetor com FOR e monta a mensagem das tentativas
function mostrarHistorico() {
    var html = '<div class="lista-tentativas">';

    for (var i = 0; i < tentativas.length; i++) {                          // <-- FOR
        html += "Tentativa " + tentativas[i].numero + " de " + MAX_TENTATIVAS +
            ": " + escaparTexto(tentativas[i].mensagem) + "<br>";
    }

    var restantes = MAX_TENTATIVAS - tentativas.length;
    if (restantes > 0) {
        html += "<b>Restam " + restantes + (restantes == 1 ? " tentativa." : " tentativas.") + "</b>";
    }
    html += "</div>";

    finalizarAguardar(html);
}

// Esconde o botão e mostra a contagem regressiva (um setTimeout por segundo)
function iniciarBloqueio(ate) {
    btn_entrar.style.display = "none";
    contarBloqueio(ate);
}

function contarBloqueio(ate) {
    var falta = Math.ceil((ate - Date.now()) / 1000);
    if (falta <= 0) {
        limparTentativas();
        return;
    }
    mostrarHistorico();
    div_erros_login.firstChild.innerHTML += "<b>Limite de " + MAX_TENTATIVAS + " tentativas atingido. " +
        "Tente de novo em " + falta + " s.</b>";
    setTimeout(function () { contarBloqueio(ate); }, 1000);
}

// Zera o vetor, mostra o botão de novo e some com as mensagens
function limparTentativas() {
    tentativas = [];
    sessionStorage.removeItem(CHAVE_TENTATIVAS);
    sessionStorage.removeItem(CHAVE_BLOQUEIO);

    btn_entrar.style.display = "";

    div_erros_login.style.display = "none";
    div_erros_login.innerHTML = "";
}

// Evita que um texto vindo do servidor vire HTML na tela
function escaparTexto(texto) {
    var div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function sumirMensagem() {
    cardErro.style.display = "none"
}

iniciarLogin();
