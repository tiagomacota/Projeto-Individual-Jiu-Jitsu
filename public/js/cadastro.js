// ==========================================================================
// CADASTRO.JS — tela de cadastro (antes ficava dentro do <script> do cadastro.html)
// Depende de: sessao.js
//
// REGRA NOVA: a senha precisa ter 8 caracteres ou mais (veja o "if" em cadastrar()).
// Ela vale só para cadastros novos: contas antigas com senha menor continuam
// entrando normalmente, porque o login não confere o tamanho.
// ==========================================================================

// ---------------------------------------------------------------------------
// CÓDIGO ANTIGO do web-data-viz (AquaTech): o cadastro vinculava o usuário a uma
// empresa por "código de ativação". Mantido abaixo só como referência, inativo.
// ---------------------------------------------------------------------------
// script antigo (AquaTech):   // Array para armazenar empresas cadastradas para validação de código de ativação 
// script antigo (AquaTech):   let listaEmpresasCadastradas = [];
//
// script antigo (AquaTech):   function cadastrar() {
// script antigo (AquaTech):     // aguardar();
//
// script antigo (AquaTech):     //Recupere o valor da nova input pelo nome do id
// script antigo (AquaTech):     // Agora vá para o método fetch logo abaixo
// script antigo (AquaTech):     var nomeVar = nome_input.value;
// script antigo (AquaTech):     var emailVar = email_input.value;
// script antigo (AquaTech):     var senhaVar = senha_input.value;
// script antigo (AquaTech):     var confirmacaoSenhaVar = confirmacao_senha_input.value;
// script antigo (AquaTech):     var codigoVar = codigo_input.value;
// script antigo (AquaTech):     var idEmpresaVincular
//
// script antigo (AquaTech):     // Verificando se há algum campo em branco
// script antigo (AquaTech):     if (
// script antigo (AquaTech):       nomeVar == "" ||
// script antigo (AquaTech):       emailVar == "" ||
// script antigo (AquaTech):       senhaVar == "" ||
// script antigo (AquaTech):       confirmacaoSenhaVar == "" ||
// script antigo (AquaTech):       codigoVar == ""
// script antigo (AquaTech):     ) {
// script antigo (AquaTech):       cardErro.style.display = "block";
// script antigo (AquaTech):       mensagem_erro.innerHTML =
// script antigo (AquaTech):         "(Mensagem de erro para todos os campos em branco)";
//
// script antigo (AquaTech):       finalizarAguardar();
// script antigo (AquaTech):       return false;
// script antigo (AquaTech):     } else {
// script antigo (AquaTech):       setInterval(sumirMensagem, 5000);
// script antigo (AquaTech):     }
//
// script antigo (AquaTech):     // Verificando se o código de ativação é de alguma empresa cadastrada
// script antigo (AquaTech):     for (let i = 0; i < listaEmpresasCadastradas.length; i++) {
// script antigo (AquaTech):       if (listaEmpresasCadastradas[i].codigo_ativacao == codigoVar) {
// script antigo (AquaTech):         idEmpresaVincular = listaEmpresasCadastradas[i].id
// script antigo (AquaTech):         console.log("Código de ativação válido.");
// script antigo (AquaTech):         break;
// script antigo (AquaTech):       } else {
// script antigo (AquaTech):         cardErro.style.display = "block";
// script antigo (AquaTech):         mensagem_erro.innerHTML = "(Mensagem de erro para código inválido)";
// script antigo (AquaTech):         finalizarAguardar();
// script antigo (AquaTech):       }
// script antigo (AquaTech):     }
//
// script antigo (AquaTech):     // Enviando o valor da nova input
// script antigo (AquaTech):     fetch("/usuarios/cadastrar", {
// script antigo (AquaTech):       method: "POST",
// script antigo (AquaTech):       headers: {
// script antigo (AquaTech):         "Content-Type": "application/json",
// script antigo (AquaTech):       },
// script antigo (AquaTech):       body: JSON.stringify({
// script antigo (AquaTech):         // crie um atributo que recebe o valor recuperado aqui
// script antigo (AquaTech):         // Agora vá para o arquivo routes/usuario.js
// script antigo (AquaTech):         nomeServer: nomeVar,
// script antigo (AquaTech):         emailServer: emailVar,
// script antigo (AquaTech):         senhaServer: senhaVar,
// script antigo (AquaTech):         idEmpresaVincularServer: idEmpresaVincular
// script antigo (AquaTech):       }),
// script antigo (AquaTech):     })
// script antigo (AquaTech):       .then(function (resposta) {
// script antigo (AquaTech):         console.log("resposta: ", resposta);
//
// script antigo (AquaTech):         if (resposta.ok) {
// script antigo (AquaTech):           cardErro.style.display = "block";
//
// script antigo (AquaTech):           mensagem_erro.innerHTML =
// script antigo (AquaTech):             "Cadastro realizado com sucesso! Redirecionando para tela de Login...";
//
// script antigo (AquaTech):           setTimeout(() => {
// script antigo (AquaTech):             window.location = "login.html";
// script antigo (AquaTech):           }, "2000");
//
// script antigo (AquaTech):           limparFormulario();
// script antigo (AquaTech):           finalizarAguardar();
// script antigo (AquaTech):         } else {
// script antigo (AquaTech):           throw "Houve um erro ao tentar realizar o cadastro!";
// script antigo (AquaTech):         }
// script antigo (AquaTech):       })
// script antigo (AquaTech):       .catch(function (resposta) {
// script antigo (AquaTech):         console.log(`#ERRO: ${resposta}`);
// script antigo (AquaTech):         finalizarAguardar();
// script antigo (AquaTech):       });
//
// script antigo (AquaTech):     return false;
// script antigo (AquaTech):   }
//
// script antigo (AquaTech):   // Listando empresas cadastradas 
// script antigo (AquaTech):   function listar() {
// script antigo (AquaTech):     fetch("/empresas/listar", {
// script antigo (AquaTech):       method: "GET",
// script antigo (AquaTech):     })
// script antigo (AquaTech):       .then(function (resposta) {
// script antigo (AquaTech):         resposta.json().then((empresas) => {
// script antigo (AquaTech):           empresas.forEach((empresa) => {
// script antigo (AquaTech):             listaEmpresasCadastradas.push(empresa);
//
// script antigo (AquaTech):             console.log("listaEmpresasCadastradas")
// script antigo (AquaTech):             console.log(listaEmpresasCadastradas[0].codigo_ativacao)
// script antigo (AquaTech):           });
// script antigo (AquaTech):         });
// script antigo (AquaTech):       })
// script antigo (AquaTech):       .catch(function (resposta) {
// script antigo (AquaTech):         console.log(`#ERRO: ${resposta}`);
// script antigo (AquaTech):       });
// script antigo (AquaTech):   }
//
// script antigo (AquaTech):   function sumirMensagem() {
// script antigo (AquaTech):     cardErro.style.display = "none";
// script antigo (AquaTech):   }

// ---------------------------------------------------------------------------
// CÓDIGO NOVO (TAS | Meu Tatame)
// ---------------------------------------------------------------------------
function cadastrar() {
    var nomeVar = nome_input.value;
    var emailVar = email_input.value;
    var usernameVar = username_input.value;
    var senhaVar = senha_input.value;
    var confirmacaoSenhaVar = confirmacao_senha_input.value;

    if (nomeVar == "" || emailVar == "" || usernameVar == "" ||
        senhaVar == "" || confirmacaoSenhaVar == "") {
        mostrarErro("Preencha todos os campos!");
        return false;
    }

    // REGRA NOVA (if): 8 caracteres ou mais -> segue; menos -> mensagem de erro
    if (senhaVar.length >= 8) {
        console.log("Senha com tamanho válido.");
    } else {
        mostrarErro("A senha deve ter 8 caracteres ou mais!");
        return false;
    }

    if (senhaVar != confirmacaoSenhaVar) {
        mostrarErro("A senha e a confirmação não são iguais!");
        return false;
    }

    fetch("/usuarios/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nomeServer: nomeVar,
            emailServer: emailVar,
            usernameServer: usernameVar,
            senhaServer: senhaVar
        })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                mostrarErro("Cadastro realizado com sucesso! Redirecionando para o Login...");
                setTimeout(function () { window.location = "login.html"; }, 2000);
            } else {
                return resposta.text().then(function (texto) {
                    throw texto || "Houve um erro ao tentar realizar o cadastro!";
                });
            }
        })
        .catch(function (erro) {
            console.log("#ERRO: " + erro);
            mostrarErro(String(erro));
        });

    return false;
}

function mostrarErro(texto) {
    cardErro.style.display = "block";
    mensagem_erro.textContent = texto;
    setTimeout(sumirMensagem, 5000);
}

function sumirMensagem() {
    cardErro.style.display = "none";
}
