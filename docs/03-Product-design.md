# Product design

## Histórias de usuários

Com base na análise das personas, foram identificadas as seguintes histórias de usuários:

| EU COMO... `PERSONA` | QUERO/PRECISO ... `FUNCIONALIDADE` | PARA ... `MOTIVO/VALOR` |
| :--- | :--- | :--- |
| **João Vítor** | Realizar pedidos pelo celular | Evitar filas e ganhar tempo no intervalo. |
| **João Vítor** | Retirar meu lanche rapidamente | Comer com tranquilidade antes da próxima aula. |
| **João Vítor** | Acompanhar o status do pedido | Saber quando o lanche estará pronto para busca. |
| **João Vítor** | Um sistema organizado de retirada | Aproveitar melhor meu tempo de descanso no campus. |
| **Maria Eduarda** | Organizar meu tempo no Campus | Evitar estresses com horários e filas extensas. |
| **Maria Eduarda** | Saber que horas meu pedido ficará pronto | Ter mais tranquilidade na rotina acadêmica. |
| **Maria Eduarda** | Evitar aglomerações na lanchonete | Reduzir a ansiedade e ter mais conforto no intervalo. |
| **Maria Eduarda** | Uma interface simples e intuitiva | Fazer pedidos sem dificuldade ou estresse cognitivo. |
| **Carlos Henrique** | Reduzir filas nos horários de pico | Melhorar a experiência dos clientes na lanchonete. |
| **Carlos Henrique** | Controlar os pedidos em tempo real | Garantir uma operação mais eficiente e ágil. |
| **Carlos Henrique** | Aumentar o número de vendas | Melhorar o faturamento e a rentabilidade do negócio. |
| **Carlos Henrique** | Ter acesso a relatórios de desempenho | Tomar decisões gerenciais mais assertivas. |

## Proposta de valor

##### Persona 1 - Maria Eduarda
![Proposta de Valor - Persona 1](images/proposta-de-valor-1.png)

##### Persona  2 - João Vítor
![Proposta de Valor - Persona 2](images/proposta-de-valor-2.png)

##### Persona  3 - Carlos Henrique
![Proposta de Valor - Persona 3](images/proposta-de-valor-3.png)

## Requisitos

As tabelas a seguir apresentam os requisitos funcionais e não funcionais que detalham o escopo do projeto FlashLanche.

Para priorização, foi aplicada a técnica **MoSCoW**. Cada requisito foi classificado como *Must have* (funcionalidade indispensável para o sistema operar — vira **ALTA**), *Should have* (importante, mas o sistema sobrevive sem ela no curto prazo — vira **MÉDIA**) ou *Could have* (desejável, agrega valor mas não é crítica — vira **BAIXA**); a categoria *Won't have* foi usada para descartar itens fora do escopo acadêmico (ex.: pagamento online real, backend/banco de dados) e por isso não aparece nas tabelas. O critério de corte entre Must/Should foi: "o fluxo principal (cliente pedir e gerente gerenciar) quebra sem isso?" — se sim, ALTA; se é um refinamento sobre um fluxo que já funciona, MÉDIA; se é um complemento de conforto/acessibilidade, BAIXA.

### Requisitos funcionais

| ID | Descrição do Requisito | Prioridade |
|---|---|---|
| RF-001 | Permitir que o visitante crie uma conta informando usuário, e-mail, telefone e senha | ALTA |
| RF-002 | Permitir que o usuário faça login com usuário e senha cadastrados | ALTA |
| RF-003 | Permitir que o usuário encerre a sessão (logout) | ALTA |
| RF-004 | Diferenciar o acesso por perfil de usuário: Visitante, Cliente Comum e Gerente (RBAC) | ALTA |
| RF-005 | Bloquear o acesso a rotas restritas por usuários sem permissão, redirecionando-os com uma mensagem explicativa | ALTA |
| RF-006 | Permitir que o cliente edite seus dados de conta (e-mail e telefone) | MÉDIA |
| RF-007 | Permitir que o cliente altere sua senha, mediante confirmação da senha atual | MÉDIA |
| RF-008 | Exibir o cardápio de produtos disponíveis para o cliente | ALTA |
| RF-009 | Permitir favoritar/desfavoritar produtos, mantendo a lista de favoritos individual por usuário | MÉDIA |
| RF-010 | Permitir adicionar produtos ao carrinho de compras, individual por usuário | ALTA |
| RF-011 | Permitir editar a quantidade ou remover itens do carrinho | ALTA |
| RF-012 | Permitir aplicar um cupom de desconto ao carrinho | MÉDIA |
| RF-013 | Permitir selecionar um horário de retirada, respeitando o limite de vagas configurado | ALTA |
| RF-014 | Permitir finalizar o pedido (checkout) utilizando os dados já cadastrados na conta do cliente | ALTA |
| RF-015 | Gerar um QR Code contendo os dados do pedido finalizado | ALTA |
| RF-016 | Exibir ao cliente o histórico "Meus Pedidos", individual por usuário | MÉDIA |
| RF-017 | Disponibilizar um leitor de tela (TTS) que narra o conteúdo da página, com opção de ocultar/exibir o widget | BAIXA |
| RF-018 | Exibir ao gerente um dashboard com métricas do dia (pedidos, produtos cadastrados, estoque total, receita) | ALTA |
| RF-019 | Permitir ao gerente cadastrar, editar e remover produtos do cardápio (CRUD) | ALTA |
| RF-020 | Permitir ao gerente gerenciar o estoque de produtos (entradas e ajustes de quantidade) | ALTA |
| RF-021 | Permitir ao gerente cadastrar e gerenciar horários de retirada e suas capacidades | MÉDIA |
| RF-022 | Permitir ao gerente cadastrar, editar e remover cupons de desconto (CRUD) | MÉDIA |
| RF-023 | Permitir ao gerente ler/validar o QR Code do pedido para registrá-lo oficialmente no sistema | ALTA |
| RF-024 | Permitir ao gerente gerenciar pedidos (alterar status de preparo, cancelar) | ALTA |
| RF-025 | Emitir relatórios de vendas e desempenho da lanchonete em um período selecionado | MÉDIA |
| RF-026 | Permitir ao gerente ocultar/exibir o menu lateral (sidebar) do painel administrativo | BAIXA |

### Requisitos não funcionais

| ID | Descrição do Requisito | Prioridade |
|---|---|---|
| RNF-001 | O sistema deve ser responsivo, adaptando o layout para desktop, tablet e dispositivos móveis | ALTA |
| RNF-002 | O sistema deve funcionar inteiramente client-side, persistindo os dados via `localStorage`/`sessionStorage`, sem depender de um backend ou banco de dados | ALTA |
| RNF-003 | A sessão do usuário deve expirar automaticamente ao fechar a aba/navegador (uso de `sessionStorage` para o estado de autenticação) | MÉDIA |
| RNF-004 | O sistema deve ser desenvolvido exclusivamente com HTML, CSS, Bootstrap e JavaScript (+ bibliotecas JS auxiliares), sem uso de frameworks front-end (React, Vue, Angular etc.) | ALTA |
| RNF-005 | O sistema deve fornecer feedback visual claro ao usuário em ações relevantes (toasts de sucesso/erro, validação inline de formulários) | MÉDIA |
| RNF-006 | O sistema deve seguir boas práticas de acessibilidade, incluindo atributos ARIA e um recurso de leitura de tela (TTS) | MÉDIA |
| RNF-007 | O sistema deve impedir, no lado do cliente, o acesso de usuários não autorizados a páginas e ações restritas por perfil | ALTA |
| RNF-008 | O sistema não deve depender de build tools (bundlers/transpiladores), devendo rodar diretamente no navegador a partir dos arquivos estáticos | BAIXA |
| RNF-009 | O sistema deve ser compatível com os navegadores modernos mais utilizados (Chrome, Firefox, Edge) em suas versões recentes | MÉDIA |
| RNF-010 | O código deve ser organizado de forma modular (por página/funcionalidade), facilitando manutenção e extensão futura | BAIXA |


## Restrições

O projeto está restrito aos itens apresentados na tabela a seguir.

| ID | Restrição |
|----|-----------|
| 001 | O projeto deverá ser entregue até o final do semestre |
| 002 | Não é permitido o desenvolvimento de um módulo de back-end |
| 003 | Não é permitida a utilização de banco de dados; toda a persistência deve ocorrer via Web Storage API (`localStorage`/`sessionStorage`) do navegador |
| 004 | Não é permitido o uso de nenhum framework front-end além do Bootstrap (ex.: React, Vue, Angular) — apenas HTML, CSS, Bootstrap e JavaScript com bibliotecas JS auxiliares |
| 005 | As senhas dos usuários devem ser armazenadas em texto plano no `localStorage`, por se tratar de um projeto acadêmico sem infraestrutura de backend para hashing seguro |
| 006 | Não há elevação de privilégio (Cliente Comum → Gerente) pela interface; a alteração do papel do usuário só pode ser feita manualmente, editando o Storage do navegador |
| 007 | O registro oficial de um pedido no sistema do gerente só pode ocorrer através da leitura do QR Code gerado no checkout, não podendo existir outra via de cadastro |
| 008 | Os dados persistidos (carrinho, favoritos, pedidos, sessão) são isolados por navegador/dispositivo, não havendo sincronização entre diferentes dispositivos de um mesmo usuário |
| 009 | O projeto deve ser desenvolvido individualmente, sem divisão de módulos entre múltiplos integrantes |
| 010 | A entrega deve seguir o repositório Git informado (`projeto-TIAW`), com histórico de commits demonstrando a evolução do desenvolvimento |
