# Especificação: Governança de espécies em aquários (AquaTech)

## 1. Contexto

A AquaTech opera aquários com características diferentes (alguns de água doce, outros de água salgada). Cada aquário mantém uma população de espécies específicas e precisa seguir parâmetros de qualidade para garantir o bem-estar dos peixes.

Hoje, as informações sobre as espécies estão espalhadas em planilhas e conversas informais, o que gerou três problemas recorrentes:

1. **Espécies duplicadas:** a mesma espécie é cadastrada com nomes iguais ou variações (ex.: "Peixe Dourado", "peixe-dourado", "Peixe dourado"), o que dificulta saber o que já existe.
2. **Associação incompatível:** em algumas situações, uma espécie foi associada a um aquário com tipo de água incompatível, causando mortalidade e prejuízo.
3. **Falta de visibilidade:** a equipe não consegue visualizar facilmente todas as espécies cadastradas nem filtrar por características importantes (tipo de água, tamanho etc.).

A diretoria decidiu centralizar esse controle no sistema web já utilizado pela equipe (projeto **web-data-viz**). O sistema, desenvolvido em Node.js + Express com banco MySQL e front-end em HTML/CSS/JS puro, já possui:

- cadastro e login de usuários, vinculados a uma empresa;
- cadastro de empresas;
- cadastro de aquários (tabela `aquario`: `id`, `descricao`, `fk_empresa`), onde cada aquário pertence a uma empresa;
- painel de gestão com as telas **Aquários e Terrários** (`cards.html`), **Gráficos** (`dashboard.html`) e **Mural de Avisos** (`mural.html`).

O que falta é um controle de espécies integrado a esse painel, que permita cadastrar espécies, associá-las a aquários e consultar rapidamente o que há em cada aquário antes de inserir novas populações.

## 2. Objetivo

Centralizar a gestão de espécies no sistema web da AquaTech, de modo que a equipe possa:

- manter um **catálogo único e sem duplicidades** de espécies;
- **associar espécies a aquários** apenas quando o tipo de água for compatível, evitando mortalidade por incompatibilidade;
- **visualizar e filtrar** as espécies cadastradas e o que está associado a cada aquário, apoiando a decisão antes de novas populações serem inseridas.

Resultado esperado: eliminar nomes duplicados, impedir associações incompatíveis e substituir planilhas e conversas informais como fonte de consulta.

## 3. Escopo

Delimita o que será desenvolvido nesta versão.

- **Dentro do escopo:**
  - Adicionar o campo **tipo de água** (doce ou salgada) ao aquário, com script de migração para os aquários já existentes.
  - Cadastro, listagem, edição e exclusão de **espécies**.
  - Prevenção de espécies duplicadas por meio de comparação normalizada do nome.
  - **Associação** de espécies a aquários (com quantidade), edição da quantidade e remoção da associação.
  - Bloqueio de associação quando o tipo de água da espécie for diferente do tipo de água do aquário.
  - Listagem geral de espécies com **filtros** (tipo de água, tamanho e busca por nome).
  - Visualização das espécies associadas a cada aquário, acessível a partir da tela de aquários.
  - Novo item de menu **Espécies** no painel, seguindo o padrão visual existente.
  - Novas camadas `routes`, `controllers` e `models` de espécie, seguindo a arquitetura atual do projeto.

- **Fora do escopo:**
  - Tela para cadastrar, editar ou excluir aquários (apenas a coluna `tipo_agua` e sua migração são tratadas aqui).
  - Validação automática da faixa de temperatura da espécie contra as medidas do sensor (a faixa é apenas informativa nesta versão).
  - Outros parâmetros de qualidade da água (pH, salinidade etc.).
  - Histórico ou auditoria de alterações de população.
  - Perfis de permissão diferentes (todos os usuários da empresa têm o mesmo acesso).
  - Importação das planilhas atuais.
  - Upload de fotos das espécies.

- **Premissas adotadas** (a validar com a diretoria):
  - O catálogo de espécies pertence a **cada empresa**, seguindo o mesmo isolamento já usado em aquários; usuários só enxergam dados da própria empresa.
  - "Tamanho" é tratado como categoria (Pequeno, Médio ou Grande), por facilitar o filtro.
  - Um aquário só tem um tipo de água, e uma espécie só vive em um tipo de água.

## 4. Funcionalidades

**F01. Cadastrar espécie**
O usuário informa nome, tipo de água e tamanho (obrigatórios), além de nome científico e faixa de temperatura ideal (opcionais). A espécie fica vinculada à empresa do usuário logado.

**F02. Listar espécies**
O usuário visualiza todas as espécies da sua empresa em uma tabela com nome, nome científico, tipo de água, tamanho, faixa de temperatura e quantidade de aquários em que está associada.

**F03. Filtrar e pesquisar espécies**
O usuário filtra a listagem por tipo de água, por tamanho e por trecho do nome. Os filtros podem ser combinados e limpos com um único clique.

**F04. Editar espécie**
O usuário altera os dados de uma espécie já cadastrada, respeitando as regras de duplicidade e de compatibilidade.

**F05. Excluir espécie**
O usuário remove uma espécie do catálogo, desde que ela não esteja associada a nenhum aquário. A exclusão exige confirmação.

**F06. Associar espécie a um aquário**
Na visualização de um aquário, o usuário escolhe uma espécie e informa a quantidade. A lista de escolha exibe somente espécies compatíveis com o tipo de água do aquário.

**F07. Visualizar espécies de um aquário**
O usuário vê, para cada aquário, o tipo de água, as espécies associadas, a quantidade de cada uma e o total de indivíduos. Serve de apoio para decidir antes de inserir novas populações.

**F08. Alterar quantidade ou remover associação**
O usuário atualiza a quantidade de uma espécie em um aquário ou remove a associação, sem excluir a espécie do catálogo.

**F09. Definir tipo de água do aquário**
O aquário passa a ter tipo de água (doce ou salgada). Aquários existentes recebem o valor por script de migração, e o tipo é exibido nos cards da tela **Aquários e Terrários**.

## 5. Regras de negócio

### 5.1 Modelo de dados

Alteração em `aquario`:

| Campo | Tipo | Regra |
|---|---|---|
| `tipo_agua` | ENUM('doce', 'salgada') | Novo campo. Aceita nulo apenas para registros antigos ainda não migrados. |

Nova tabela `especie`:

| Campo | Tipo | Regra |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | |
| `nome` | VARCHAR(60) | Obrigatório. Nome como digitado pelo usuário (após remover espaços extras nas pontas). |
| `nome_normalizado` | VARCHAR(60) | Obrigatório. Gerado pelo back-end a partir do `nome`. |
| `nome_cientifico` | VARCHAR(100) | Opcional. |
| `tipo_agua` | ENUM('doce', 'salgada') | Obrigatório. |
| `tamanho` | ENUM('pequeno', 'medio', 'grande') | Obrigatório. |
| `temp_min` | DECIMAL(4,1) | Opcional. |
| `temp_max` | DECIMAL(4,1) | Opcional. |
| `fk_empresa` | INT, FK → `empresa(id)` | Obrigatório. |
| | | `UNIQUE (fk_empresa, nome_normalizado)` |

Nova tabela `aquario_especie`:

| Campo | Tipo | Regra |
|---|---|---|
| `fk_aquario` | INT, FK → `aquario(id)` | Obrigatório. |
| `fk_especie` | INT, FK → `especie(id)` | Obrigatório. |
| `quantidade` | INT | Obrigatório, inteiro maior ou igual a 1. |
| | | `PRIMARY KEY (fk_aquario, fk_especie)` |

### 5.2 Campos obrigatórios e validações

- Nome, tipo de água e tamanho são obrigatórios no cadastro e na edição de espécie. O back-end responde `400` com mensagem clara quando algum estiver ausente ou vazio, no mesmo padrão dos controllers atuais.
- O nome deve ter entre 2 e 60 caracteres após remover espaços nas pontas.
- Tipo de água e tamanho só aceitam os valores definidos nos ENUMs.
- Se `temp_min` e `temp_max` forem informadas, `temp_min` deve ser menor ou igual a `temp_max`. Se apenas uma for informada, a outra deve ser preenchida também.
- Quantidade deve ser um número inteiro maior ou igual a 1.

### 5.3 Dados duplicados

- O nome é normalizado antes de comparar: remover espaços nas pontas, converter para minúsculas, remover acentos e trocar hífens e espaços repetidos por um único espaço. Assim, "Peixe Dourado", "peixe-dourado" e "  Peixe  dourado " resultam em `peixe dourado` e são tratados como a mesma espécie.
- Não é permitido cadastrar nem editar uma espécie de modo que seu `nome_normalizado` coincida com outra da mesma empresa. O sistema responde `409` com a mensagem informando qual espécie já existe (ex.: "Já existe a espécie 'Peixe Dourado'.").
- Empresas diferentes podem ter espécies com o mesmo nome.
- Uma mesma espécie não pode ser associada duas vezes ao mesmo aquário (garantido pela chave primária composta). Para mudar o número de indivíduos, deve-se editar a quantidade.

### 5.4 Compatibilidade de tipo de água

- Uma espécie só pode ser associada a um aquário se `especie.tipo_agua` for igual a `aquario.tipo_agua`. A regra é validada **no back-end**; o front-end apenas facilita ocultando as opções incompatíveis.
- Aquário sem `tipo_agua` definido não aceita associações, e o sistema informa que o tipo de água precisa ser definido antes.
- Ao editar uma espécie, o tipo de água só pode ser alterado se ela não estiver associada a nenhum aquário.

### 5.5 Restrições de acesso

- Todas as operações exigem usuário logado. O sistema usa a empresa do usuário para restringir a consulta e a alteração de espécies e aquários.
- Espécies e aquários de outras empresas não podem ser listados, associados, editados ou excluídos, mesmo que o id seja informado manualmente na requisição (resposta `403` ou `404`).
- Para isso, o login passa a devolver também o `empresaId` do usuário, guardado na sessão junto aos dados já existentes.

### 5.6 Edição e exclusão

- **Editar espécie:** permitido a qualquer usuário da empresa. Alterações de nome, tamanho, nome científico e faixa de temperatura refletem imediatamente em todos os aquários associados. A alteração do tipo de água segue a regra 5.4.
- **Excluir espécie:** bloqueada enquanto houver associação com algum aquário. A mensagem informa em quantos aquários a espécie está presente e orienta a remover as associações antes.
- **Remover associação:** sempre permitida, e não afeta o cadastro da espécie.
- Toda exclusão pede confirmação explícita do usuário.

## 6. Interface

O sistema mantém o padrão visual existente: tema escuro, menu lateral à esquerda (`header-left`) com os botões de navegação, destaque na cor rosa (`#e6005a`) e estilos reaproveitados de `dashboards.css` e `estilo.css`. Fonte e componentes (botões, cards, formulários) seguem o que já é usado nas telas do dashboard.

### 6.1 Navegação

- Novo botão **Espécies** no menu lateral, entre **Aquários e Terrários** e **Gráficos**, em todas as telas do dashboard. O botão da tela ativa fica destacado, como nos demais.

### 6.2 Tela "Espécies" (`public/dashboard/especies.html`)

- **Formulário de cadastro** no topo (mesmo padrão do Mural de Avisos): campos Nome, Nome científico, Tipo de água (seleção: Doce / Salgada), Tamanho (seleção: Pequeno / Médio / Grande), Temperatura mínima e Temperatura máxima, e botão **Cadastrar**.
- **Barra de filtros** acima da tabela: campo de busca por nome, seleção de tipo de água, seleção de tamanho e botão **Limpar filtros**. A listagem atualiza ao alterar os filtros.
- **Tabela de espécies** com as colunas: Nome, Nome científico, Tipo de água, Tamanho, Temperatura ideal, Aquários associados e Ações (**Editar** e **Excluir**). O tipo de água aparece como etiqueta colorida (ex.: azul para água doce e ciano para água salgada), para leitura rápida.
- **Edição:** ao clicar em Editar, o formulário é preenchido com os dados da espécie, e o botão passa a **Salvar alterações**, com opção de cancelar.
- **Exclusão:** ao clicar em Excluir, abre uma confirmação. Se houver associação, a mensagem de bloqueio é exibida.
- **Estado vazio:** quando não há espécies ou os filtros não retornam resultados, exibe "Nenhuma espécie encontrada".

### 6.3 Tela "Aquários e Terrários" (`cards.html`)

- Cada card de aquário passa a mostrar o **tipo de água** e a quantidade de espécies associadas.
- Cada card ganha o botão **Ver espécies**, que leva à visualização do aquário.

### 6.4 Visualização de espécies do aquário (`public/dashboard/aquario-especies.html?id=`)

- Cabeçalho com a descrição do aquário, o tipo de água e o total de indivíduos.
- Tabela de espécies associadas: Nome, Tamanho, Quantidade e Ações (**Alterar quantidade** e **Remover**).
- Bloco **Associar espécie**: seleção de espécie (somente compatíveis com o tipo de água do aquário e ainda não associadas), campo Quantidade e botão **Associar**.
- Se o aquário não tiver tipo de água definido, o bloco de associação fica desabilitado com aviso explicativo.
- Botão **Voltar** para a tela de aquários.

### 6.5 Mensagens

- Sucesso: "Espécie cadastrada com sucesso.", "Espécie atualizada.", "Espécie excluída.", "Espécie associada ao aquário.", "Associação removida."
- Validação: "Preencha nome, tipo de água e tamanho.", "A temperatura mínima não pode ser maior que a máxima.", "Informe uma quantidade inteira maior que zero."
- Regras de negócio: "Já existe a espécie '[nome]'.", "Esta espécie é de água [doce/salgada] e o aquário é de água [salgada/doce].", "Não é possível excluir: a espécie está associada a [n] aquário(s)."
- As mensagens aparecem na própria tela (faixa de aviso acima do formulário), sem depender de `alert()` do navegador, e desaparecem ao realizar nova ação.

### 6.6 Aspectos técnicos de interface

- As telas validam a sessão ao carregar (`validarSessao()`); sem sessão, redirecionam para `login.html`.
- Chamadas à API via `fetch`, seguindo o padrão já usado em `mural.html`.
- Novas rotas na API, seguindo o fluxo `front-end → routes → controllers → models`:
  - `GET /especies/:empresaId` (aceita `?tipoAgua=`, `?tamanho=`, `?busca=`)
  - `POST /especies/cadastrar`
  - `PUT /especies/editar/:idEspecie`
  - `DELETE /especies/deletar/:idEspecie`
  - `GET /aquarios/:idAquario/especies`
  - `POST /aquarios/:idAquario/especies`
  - `PUT /aquarios/:idAquario/especies/:idEspecie`
  - `DELETE /aquarios/:idAquario/especies/:idEspecie`

## 7. Critérios de aceitação

**Cadastro e duplicidade**

- **CA01.** Ao cadastrar uma espécie com nome, tipo de água e tamanho válidos, ela aparece na listagem da empresa sem recarregar manualmente os dados.
- **CA02.** Ao tentar cadastrar com nome, tipo de água ou tamanho vazio, o cadastro é recusado e a mensagem de campos obrigatórios é exibida.
- **CA03.** Com "Peixe Dourado" já cadastrado, tentar cadastrar "peixe-dourado", "Peixe dourado" ou "  PEIXE  DOURADO " é recusado com a mensagem "Já existe a espécie 'Peixe Dourado'.".
- **CA04.** Duas empresas diferentes conseguem cadastrar uma espécie com o mesmo nome, sem conflito.
- **CA05.** Editar uma espécie para um nome que, normalizado, coincida com outra da mesma empresa é recusado; editar mantendo o próprio nome é aceito.

**Compatibilidade**

- **CA06.** Ao associar uma espécie de água doce a um aquário de água salgada (ou o inverso), a associação é recusada pela API com a mensagem de incompatibilidade, mesmo que a requisição seja feita fora da tela.
- **CA07.** No bloco **Associar espécie**, só aparecem espécies com o mesmo tipo de água do aquário.
- **CA08.** Um aquário sem tipo de água definido não aceita associações e exibe aviso na tela.
- **CA09.** Alterar o tipo de água de uma espécie já associada a algum aquário é recusado; se não estiver associada, é aceito.
- **CA10.** Associar a mesma espécie duas vezes ao mesmo aquário é recusado, e a tela orienta a alterar a quantidade.
- **CA11.** Quantidade vazia, zero, negativa ou decimal é recusada.

**Visualização e filtros**

- **CA12.** A tela **Espécies** lista todas as espécies da empresa, com a quantidade de aquários associados em cada uma.
- **CA13.** Filtrar por "Água salgada" exibe apenas espécies de água salgada; combinar com tamanho "Pequeno" exibe apenas as que atendem aos dois critérios.
- **CA14.** A busca por trecho do nome retorna espécies independentemente de maiúsculas, minúsculas e acentos.
- **CA15.** **Limpar filtros** restaura a listagem completa.
- **CA16.** A visualização de um aquário mostra o tipo de água, as espécies associadas com suas quantidades e o total de indivíduos, e esses valores refletem imediatamente associações, alterações e remoções.
- **CA17.** Cada card de aquário em **Aquários e Terrários** exibe o tipo de água e o botão **Ver espécies**.

**Edição e exclusão**

- **CA18.** Excluir uma espécie sem associações a remove da listagem após confirmação.
- **CA19.** Excluir uma espécie associada a algum aquário é recusado com a mensagem informando o número de aquários.
- **CA20.** Remover a associação de uma espécie com um aquário não exclui a espécie do catálogo.
- **CA21.** Alterar o nome ou o tamanho de uma espécie atualiza a informação em todas as visualizações de aquário em que ela aparece.

**Segurança e sessão**

- **CA22.** Um usuário não consegue listar, editar, excluir ou associar espécies e aquários de outra empresa, nem alterando manualmente os ids na requisição.
- **CA23.** Acessar qualquer tela nova sem estar logado redireciona para a tela de login.

**Migração**

- **CA24.** Após executar o script de migração, a coluna `tipo_agua` existe em `aquario`, as tabelas `especie` e `aquario_especie` foram criadas com as restrições descritas, e os aquários existentes têm tipo de água definido.
