# Plano de testes de software

O plano de testes de software é gerado a partir da especificação do sistema (ver [Especificação do projeto](03-Product-design.md)) e consiste em casos de teste que devem ser executados conforme a implementação de cada funcionalidade for concluída. Os cenários a seguir demonstram o atendimento aos requisitos funcionais RF-001 a RF-026.

## Escopo dos testes

**Funcionalidades avaliadas:** cadastro e login de usuários, controle de acesso por perfil (RBAC), edição de dados da conta, cardápio e favoritos, carrinho de compras e cupom de desconto, checkout e geração de QR Code, leitura/validação de QR Code, apresentação de pedidos (cliente e gerente), dashboard gerencial, CRUD de produtos, controle de estoque, CRUD de horários de retirada e CRUD de cupons.

**Grupo de usuários:** simulando dois perfis de usuário através dos registros de teste (mock) definidos no sistema: `user`/`123` (Cliente Comum) e `admin`/`123` (Gerente), além de contas adicionais criadas via tela de Cadastro para validar o fluxo completo.

**Ferramentas utilizadas:**
- Navegadores Google Chrome e Mozilla Firefox (versões atuais), em suas ferramentas de desenvolvedor (DevTools) para inspecionar `localStorage`/`sessionStorage` e simular diferentes resoluções de tela (responsividade);
- Modo de navegação anônima/privada, para testar o comportamento de "Cenário de Inicialização" (usuários mock) sem interferência de dados de sessões anteriores;
- Ambiente hospedado em produção (Vercel), utilizado para os testes finais de homologação.

---

| **Caso de teste**  | **CT-001 – Cadastrar novo usuário**  |
|:---: |:---: |
| Requisito associado | RF-001 - Permitir que o visitante crie uma conta informando usuário, e-mail, telefone e senha. |
| Objetivo do teste | Verificar se um visitante consegue criar uma nova conta de Cliente Comum. |
| Passos | - Acessar o navegador <br> - Informar o endereço do site em produção <br> - Clicar em "Começar" na página inicial <br> - Preencher usuário, e-mail, telefone, senha e confirmação de senha <br> - Clicar em "Criar conta" |
| Critério de êxito | - O cadastro é realizado com sucesso, exibindo mensagem de confirmação e redirecionando para a tela de login. <br> - O novo usuário aparece em `localStorage.users` com `admin: false`. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-002 – Bloquear cadastro com e-mail já utilizado**  |
|:---: |:---: |
| Requisito associado | RF-001 - Permitir que o visitante crie uma conta informando usuário, e-mail, telefone e senha. |
| Objetivo do teste | Verificar se o sistema impede o cadastro de um e-mail já existente em outra conta. |
| Passos | - Acessar a tela de Cadastro <br> - Preencher os campos utilizando um e-mail já cadastrado em outra conta <br> - Clicar em "Criar conta" |
| Critério de êxito | - O cadastro é rejeitado, exibindo a mensagem "Esse e-mail já está cadastrado." |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-003 – Efetuar login com credenciais válidas**  |
|:---: |:---: |
| Requisito associado | RF-002 - Permitir que o usuário faça login com usuário e senha cadastrados. |
| Objetivo do teste | Verificar se o usuário consegue autenticar-se no sistema. |
| Passos | - Acessar a tela de Login <br> - Preencher usuário `user` e senha `123` <br> - Clicar em "Entrar" |
| Critério de êxito | - O login é realizado com sucesso <br> - O sistema redireciona para a página inicial <br> - A navbar passa a exibir "Olá, user" e os atalhos do perfil de Cliente Comum. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-004 – Rejeitar login com credenciais inválidas**  |
|:---: |:---: |
| Requisito associado | RF-002 - Permitir que o usuário faça login com usuário e senha cadastrados. |
| Objetivo do teste | Verificar se o sistema rejeita uma tentativa de login com senha incorreta. |
| Passos | - Acessar a tela de Login <br> - Preencher usuário `user` e uma senha incorreta <br> - Clicar em "Entrar" |
| Critério de êxito | - O login é rejeitado, exibindo a mensagem "Usuário ou senha inválidos." <br> - Nenhuma sessão é criada em `sessionStorage`. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-005 – Encerrar sessão (logout)**  |
|:---: |:---: |
| Requisito associado | RF-003 - Permitir que o usuário encerre a sessão (logout). |
| Objetivo do teste | Verificar se o botão "Sair" encerra a sessão corretamente. |
| Passos | - Estar logado como Cliente Comum <br> - Clicar em "Sair" na navbar ou no perfil |
| Critério de êxito | - O usuário é redirecionado para a página inicial no estado de Visitante <br> - A chave `activeSession` é removida do `sessionStorage`. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-006 – Bloquear acesso de Cliente Comum ao painel do Gerente**  |
|:---: |:---: |
| Requisito associado | RF-004 / RF-005 - Diferenciar o acesso por perfil e bloquear rotas restritas com mensagem explicativa. |
| Objetivo do teste | Verificar se um Cliente Comum é impedido de acessar o Dashboard do Gerente. |
| Passos | - Estar logado como `user` (Cliente Comum) <br> - Na página inicial, clicar no botão "Acessar painel" <br> - Alternativamente, digitar a URL direta de `dashboard.html` |
| Critério de êxito | - Ao clicar no botão da home, o sistema exibe um toast "Acesso negado: essa área é exclusiva para gerentes." e não navega <br> - Ao acessar a URL direta, o sistema exibe um alerta de acesso negado e redireciona para a página inicial. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-007 – Bloquear acesso de Visitante a páginas de cliente**  |
|:---: |:---: |
| Requisito associado | RF-005 - Bloquear o acesso a rotas restritas por usuários sem permissão. |
| Objetivo do teste | Verificar se um Visitante (sem login) é impedido de acessar o Cardápio diretamente pela URL. |
| Passos | - Sem estar logado, digitar a URL direta de `shop.html` |
| Critério de êxito | - O sistema exibe um alerta de acesso negado e redireciona para a tela de Login. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-008 – Editar e-mail e telefone da conta**  |
|:---: |:---: |
| Requisito associado | RF-006 - Permitir que o cliente edite seus dados de conta (e-mail e telefone). |
| Objetivo do teste | Verificar se o cliente consegue atualizar e-mail e telefone cadastrados. |
| Passos | - Estar logado como Cliente Comum <br> - Acessar "Meu Perfil" <br> - Na seção "Meus Dados", alterar e-mail e telefone <br> - Clicar em "Salvar alterações" |
| Critério de êxito | - O sistema exibe a mensagem "Dados atualizados com sucesso!" <br> - Os novos valores passam a constar em `localStorage.users` para o usuário logado. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-009 – Alterar senha da conta**  |
|:---: |:---: |
| Requisito associado | RF-007 - Permitir que o cliente altere sua senha, mediante confirmação da senha atual. |
| Objetivo do teste | Verificar se o cliente consegue trocar a senha informando corretamente a senha atual. |
| Passos | - Acessar "Meu Perfil" <br> - Clicar em "Alterar senha" <br> - Informar a senha atual, a nova senha e a confirmação <br> - Clicar em "Atualizar senha" |
| Critério de êxito | - O sistema confirma a alteração com sucesso <br> - Um novo login com a senha antiga passa a ser rejeitado, e com a nova senha é aceito. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-010 – Exibir cardápio de produtos**  |
|:---: |:---: |
| Requisito associado | RF-008 - Exibir o cardápio de produtos disponíveis para o cliente. |
| Objetivo do teste | Verificar se os produtos cadastrados são exibidos corretamente no cardápio. |
| Passos | - Estar logado como Cliente Comum <br> - Acessar "Cardápio" pela navbar |
| Critério de êxito | - Todos os produtos cadastrados em `localStorage.produtos` são exibidos, com nome, imagem, descrição e preço. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-011 – Favoritar e desfavoritar um produto**  |
|:---: |:---: |
| Requisito associado | RF-009 - Permitir favoritar/desfavoritar produtos, mantendo a lista individual por usuário. |
| Objetivo do teste | Verificar se favoritar um produto o adiciona à lista de favoritos do usuário logado, e não a de outro usuário. |
| Passos | - Logado como `user`, clicar no ícone de coração de um produto no Cardápio <br> - Acessar "Meu Perfil" e conferir a lista de favoritos <br> - Fazer logout e login como outra conta <br> - Conferir a lista de favoritos dessa segunda conta |
| Critério de êxito | - O produto aparece na lista de favoritos de `user` <br> - A lista de favoritos da segunda conta permanece vazia (chave `favoritos:<username>` isolada por usuário). |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-012 – Adicionar, alterar quantidade e remover item do carrinho**  |
|:---: |:---: |
| Requisito associado | RF-010 / RF-011 - Permitir adicionar produtos ao carrinho e editar quantidade/remover itens. |
| Objetivo do teste | Verificar o funcionamento completo do carrinho de compras. |
| Passos | - No Cardápio, clicar em "Adicionar ao carrinho" em dois produtos diferentes <br> - Acessar o carrinho <br> - Aumentar a quantidade de um item <br> - Remover o outro item |
| Critério de êxito | - Os itens adicionados aparecem no carrinho <br> - A alteração de quantidade reflete corretamente no subtotal <br> - O item removido desaparece da lista e do total. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-013 – Aplicar cupom de desconto válido**  |
|:---: |:---: |
| Requisito associado | RF-012 - Permitir aplicar um cupom de desconto ao carrinho. |
| Objetivo do teste | Verificar se um cupom de desconto ativo é corretamente aplicado ao total do carrinho. |
| Passos | - Com itens no carrinho, digitar um código de cupom ativo e válido no campo indicado <br> - Clicar em "Aplicar" |
| Critério de êxito | - O sistema exibe a mensagem de desconto aplicado <br> - O total do carrinho é recalculado com o percentual de desconto do cupom. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-014 – Selecionar horário de retirada e finalizar pedido**  |
|:---: |:---: |
| Requisito associado | RF-013 / RF-014 - Permitir selecionar horário de retirada respeitando o limite de vagas e finalizar o pedido com os dados da conta. |
| Objetivo do teste | Verificar se o checkout exibe corretamente os dados da conta e permite concluir o pedido apenas com um horário selecionado. |
| Passos | - Com itens no carrinho, clicar em "Finalizar Pedido" <br> - Conferir se os dados exibidos (usuário, e-mail, telefone) correspondem à conta logada <br> - Selecionar um horário de retirada disponível <br> - Clicar em "Confirmar Pedido" |
| Critério de êxito | - O botão "Confirmar Pedido" permanece desabilitado até que um horário seja selecionado <br> - Após a confirmação, o contador de vagas (`pedidos`) do horário escolhido é incrementado em `localStorage.horariosRetirada`. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-015 – Gerar QR Code do pedido**  |
|:---: |:---: |
| Requisito associado | RF-015 - Gerar um QR Code contendo os dados do pedido finalizado. |
| Objetivo do teste | Verificar se, ao confirmar o pedido, um QR Code válido é gerado. |
| Passos | - Concluir o fluxo de checkout até a confirmação do pedido |
| Critério de êxito | - Um modal de sucesso é exibido, contendo um QR Code visível e o número do pedido. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-016 – Consultar histórico "Meus Pedidos"**  |
|:---: |:---: |
| Requisito associado | RF-016 - Exibir ao cliente o histórico "Meus Pedidos", individual por usuário. |
| Objetivo do teste | Verificar se o cliente visualiza apenas os próprios pedidos. |
| Passos | - Logado como `user`, finalizar um pedido <br> - Acessar "Meus Pedidos" <br> - Fazer logout e login com outra conta que não tenha pedidos <br> - Acessar "Meus Pedidos" dessa conta |
| Critério de êxito | - O pedido realizado por `user` aparece em seu próprio histórico <br> - A segunda conta não visualiza esse pedido. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-017 – Exibir métricas do Dashboard**  |
|:---: |:---: |
| Requisito associado | RF-018 - Exibir ao gerente um dashboard com métricas do dia. |
| Objetivo do teste | Verificar se os cartões de métricas do Dashboard refletem os dados reais do sistema. |
| Passos | - Logado como `admin`, acessar o Dashboard |
| Critério de êxito | - Os cartões "Pedidos hoje", "Produtos", "Estoque total" e "Receita do dia" exibem valores condizentes com os dados cadastrados em `produtos` e `pedidos`. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-018 – Cadastrar, editar e excluir um produto**  |
|:---: |:---: |
| Requisito associado | RF-019 - Permitir ao gerente cadastrar, editar e remover produtos do cardápio (CRUD). |
| Objetivo do teste | Verificar o CRUD completo de produtos. |
| Passos | - Logado como `admin`, acessar "Produtos" <br> - Clicar em "Novo Produto" e cadastrar um item <br> - Editar o nome/preço do item cadastrado <br> - Excluir o item |
| Critério de êxito | - O produto criado aparece na listagem e no Cardápio do cliente <br> - A edição é refletida imediatamente <br> - Após a exclusão, o produto não aparece mais em nenhuma listagem. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-019 – Atualizar quantidade em estoque**  |
|:---: |:---: |
| Requisito associado | RF-020 - Permitir ao gerente gerenciar o estoque de produtos. |
| Objetivo do teste | Verificar se a alteração de estoque recalcula corretamente o status do produto. |
| Passos | - Logado como `admin`, acessar "Estoque" <br> - Reduzir a quantidade de um produto para 0 <br> - Reduzir a quantidade de outro produto para um valor baixo (ex.: 3) |
| Critério de êxito | - O produto zerado exibe status "esgotado" <br> - O produto com quantidade baixa exibe status "baixo" <br> - As mudanças refletem no Dashboard e no Cardápio. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-020 – Cadastrar horário de retirada e validar limite de vagas**  |
|:---: |:---: |
| Requisito associado | RF-021 - Permitir ao gerente cadastrar e gerenciar horários de retirada e suas capacidades. |
| Objetivo do teste | Verificar se um horário cadastrado com capacidade limitada deixa de ficar disponível ao ser preenchido. |
| Passos | - Logado como `admin`, cadastrar um horário com capacidade 1 <br> - Como cliente, finalizar um pedido escolhendo esse horário <br> - Tentar selecionar o mesmo horário em um novo pedido |
| Critério de êxito | - Após o primeiro pedido, o horário aparece como indisponível/esgotado para novas seleções. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-021 – Cadastrar, editar e excluir um cupom**  |
|:---: |:---: |
| Requisito associado | RF-022 - Permitir ao gerente cadastrar, editar e remover cupons de desconto (CRUD). |
| Objetivo do teste | Verificar o CRUD completo de cupons. |
| Passos | - Logado como `admin`, acessar "Cupons" <br> - Cadastrar um novo cupom com código, desconto e validade <br> - Editar o percentual de desconto <br> - Excluir o cupom |
| Critério de êxito | - O cupom criado é aplicável no carrinho do cliente <br> - A edição altera o desconto aplicado <br> - Após a exclusão, o código deixa de ser aceito no carrinho. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-022 – Ler QR Code e registrar pedido no painel do gerente**  |
|:---: |:---: |
| Requisito associado | RF-023 - Permitir ao gerente ler/validar o QR Code do pedido para registrá-lo oficialmente no sistema. |
| Objetivo do teste | Verificar se um pedido só passa a existir no painel do gerente após a leitura do seu QR Code. |
| Passos | - Como cliente, finalizar um pedido e gerar o QR Code <br> - Como `admin`, acessar "Pedidos" antes de ler o QR Code e conferir que o pedido não aparece <br> - Acessar "QR Codes" e ler/validar o QR Code gerado <br> - Acessar "Pedidos" novamente |
| Critério de êxito | - Antes da leitura, o pedido não consta na listagem do gerente <br> - Após a leitura, o pedido passa a aparecer corretamente na listagem de "Pedidos" do gerente. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-023 – Alterar status e cancelar um pedido**  |
|:---: |:---: |
| Requisito associado | RF-024 - Permitir ao gerente gerenciar pedidos (alterar status de preparo, cancelar). |
| Objetivo do teste | Verificar a alteração de status de um pedido e o cancelamento com liberação da vaga do horário. |
| Passos | - Com um pedido já registrado (pós-leitura de QR), acessar "Pedidos" como `admin` <br> - Abrir o pedido e alterar o status para "Preparando" e depois "Pronto" <br> - Cancelar um segundo pedido registrado |
| Critério de êxito | - O status é atualizado corretamente na listagem <br> - Ao cancelar, a vaga do horário correspondente volta a ficar disponível em `horariosRetirada`. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-024 – Emitir relatório de vendas por período**  |
|:---: |:---: |
| Requisito associado | RF-025 - Emitir relatórios de vendas e desempenho da lanchonete em um período selecionado. |
| Objetivo do teste | Verificar se o relatório reflete corretamente os pedidos do período filtrado. |
| Passos | - Logado como `admin`, acessar "Relatórios" <br> - Selecionar um período que contenha pedidos já registrados <br> - Selecionar um período sem nenhum pedido registrado |
| Critério de êxito | - No primeiro caso, os gráficos e tabelas exibem os pedidos e valores correspondentes ao período <br> - No segundo caso, o relatório indica ausência de dados sem gerar erro. |
| Responsável pela elaboração do caso de teste | Daniel |

<br>

| **Caso de teste**  | **CT-025 – Ocultar e exibir o menu lateral (sidebar)**  |
|:---: |:---: |
| Requisito associado | RF-026 - Permitir ao gerente ocultar/exibir o menu lateral (sidebar) do painel administrativo. |
| Objetivo do teste | Verificar se o gerente consegue alternar a visibilidade do menu lateral (sidebar) para expandir a área de conteúdo do painel. |
| Passos | - Logado como admin, acessar o Dashboard ou qualquer outra página do painel gerencial <br> - Localizar e clicar no botão de alternância (ícone de hambúrguer ou seta) do menu lateral <br> - Clicar novamente no mesmo botão de alternância |
| Critério de êxito | - Ao clicar para ocultar, o menu lateral é recolhido ou escondido da tela, e o conteúdo principal se expande fluidamente para ocupar o espaço. <br> - Ao clicar para exibir, o menu lateral retorna à sua posição e tamanho originais de forma correta, sem quebrar o layout da página. |
| Responsável pela elaboração do caso de teste | Daniel |
