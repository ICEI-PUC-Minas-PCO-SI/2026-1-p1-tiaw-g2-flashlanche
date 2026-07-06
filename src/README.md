# Código-fonte

Esta é a pasta destinada à manutenção do programa que será desenvolvido no contexto desta disciplina.

Se necessário, deve-se descrever neste arquivo os aspectos relevantes da estrutura de diretórios criada para a organização do código.

```plaintext
src/  (esta pasta aqui)
│
│
├── public/
│   ├── assets/
│   │     └── favicon.png
│   │
│   ├── db/
│   │    └── auth.js
│   │
│   ├── modulos/
│   │   ├── auth/
│   │   │   ├── cadastro/
│   │   │   │      ├─ cadastro.html
│   │   │   │      └── cadastro.js
│   │   │   │
│   │   │   ├── login/
│   │   │   │      ├─ login.html
│   │   │   │      └── login.js
│   │   │   │
│   │   │   └── auth.css
│   │   │
│   │   ├── cliente/
│   │   │   ├── cardapio/
│   │   │   │      ├─ shop.html
│   │   │   │      ├─ shop.css
│   │   │   │      └── shop.js
│   │   │   │
│   │   │   ├── carrinho/
│   │   │   │      ├─ cart.html
│   │   │   │      ├─ cart.css
│   │   │   │      └── cart.js
│   │   │   │
│   │   │   ├── checkout/
│   │   │   │      ├─ checkout.html
│   │   │   │      ├─ checkout.css
│   │   │   │      └── checkout.js
│   │   │   │
│   │   │   ├── pedidos/
│   │   │   │      ├─ orders.html
│   │   │   │      ├─ orders.css
│   │   │   │      └── orders.js
│   │   │   │
│   │   │   └── perfil/
│   │   │          ├─ profile.html
│   │   │          ├─ profile.css
│   │   │          └── profile.js
│   │   │
│   │   └── gerente/
│   │       ├── cupoms/
│   │       │      ├─ cupom.html
│   │       │      ├─ cupom.css
│   │       │      └── cupom.js
│   │       │
│   │       ├── dashboard/
│   │       │      ├─ dashboard.html
│   │       │      ├─ daschboard.css
│   │       │      └── dashboard.js
│   │       │
│   │       ├── estoque/
│   │       │      ├─ stock.html
│   │       │      ├─ stock.css
│   │       │      └── stock.js
│   │       │
│   │       ├── horarios/
│   │       │      ├─ timeslots.html
│   │       │      ├─ timeslots.css
│   │       │      └── timeslots.js
│   │       │
│   │       ├── pedidos/
│   │       │      ├─ orders.html
│   │       │      ├─ orders.css
│   │       │      └── orders.js
│   │       │
│   │       ├── produtos/
│   │       │      ├─ products.html
│   │       │      ├─ products.css
│   │       │      └── products.js
│   │       │
│   │       ├── relatorios/
│   │       │      ├─ reports.html
│   │       │      ├─ reports.css
│   │       │      └── reports.js
│   │       │
│   │       └── validacaoQR/
│   │              ├─ qr-validation.html
│   │              ├─ qr-validation.css
│   │              └── qr-validation.js
│   │
│   ├── index.html (página inicial)
│   ├── index.js
│   └── styles.css
│
└── README.md (este arquivo aqui)
```

## Parte front-end

Para a montagem do site, a estrutura foi organizada dentro da pasta `public`, que abriga todos os componentes da interface do front-end, visíveis ao usuário no navegador. O projeto do **FlashLanche** adota uma arquitetura modular, distribuindo as responsabilidades por perfis de uso (Cliente e Gerente) e contextos de funcionalidades (Autenticação, Cardápio, Estoque, etc.). Cada submódulo agrupa seus próprios arquivos HTML, CSS e JavaScript, facilitando a manutenção e a divisão do trabalho na equipe.

Abaixo está o detalhamento da organização dos arquivos na pasta `public`:

* **Pasta `assets/`**: Destinada aos recursos globais e mídias compartilhadas por todo o site. No estágio atual, armazena o `favicon.png` (ícone de identificação exibido na aba do navegador).
* **Pasta `db/`**: Contém a camada de simulação de persistência de dados local para o ambiente front-end. O arquivo `auth.js` gerencia as regras de armazenamento local (como o uso de *LocalStorage*) voltadas ao controle de sessões e usuários.
* **Pasta `modulos/`**: Pasta central das regras de negócio e interfaces do sistema, subdividida em três grandes escopos:
  
  * **`auth/` (Autenticação)**: Centraliza as telas e lógicas de acesso à plataforma.
    * `cadastro/`: Contém `cadastro.html` e `cadastro.js` para o formulário de registro de novos usuários.
    * `login/`: Contém `login.html` e `login.js` para a tela de login.
    * `auth.css`: Folha de estilos compartilhada pelas páginas de login e cadastro.

  * **`cliente/` (Área do Cliente)**: Reúne as funcionalidades focadas na experiência de compra do usuário final.
    * `cardapio/`: Exibição de produtos e lanches disponíveis para compra (`shop.html`, `shop.css`, `shop.js`).
    * `carrinho/`: Listagem, alteração e gerenciamento dos itens selecionados antes de fechar a compra (`cart.html`, `cart.css`, `cart.js`).
    * `checkout/`: Tela para finalização do pedido (`checkout.html`, `checkout.css`, `checkout.js`).
    * `pedidos/`: Histórico de compras anteriores e rastreamento em tempo real de pedidos em andamento (`orders.html`, `orders.css`, `orders.js`).
    * `perfil/`: Visualização, atualização e edição dos dados pessoais do cliente (`profile.html`, `profile.css`, `profile.js`).

  * **`gerente/` (Painel Administrativo)**: Agrupa as ferramentas de monitoramento operacional e gerenciamento interno da lanchonete.
    * `cupoms/`: Gerenciamento e criação de cupons promocionais e de desconto (`cupom.html`, `cupom.css`, `cupom.js`).
    * `dashboard/`: Painel central com gráficos e indicadores de desempenho de vendas do estabelecimento (`dashboard.html`, `daschboard.css`, `dashboard.js`).
    * `estoque/`: Controle de insumos, ingredientes e estoque físico de produtos (`stock.html`, `stock.css`, `stock.js`).
    * `horarios/`: Configuração de horários de retirada (`timeslots.html`, `timeslots.css`, `timeslots.js`).
    * `pedidos/`: Tela de monitoramento, triagem e alteração de status dos pedidos recebidos (`orders.html`, `orders.css`, `orders.js`).
    * `produtos/`: Tela de controle (CRUD) para cadastrar, editar e excluir itens do cardápio oficial (`products.html`, `products.css`, `products.js`).
    * `relatorios/`: Extração de relatórios gerenciais e financeiros detalhados sobre o negócio (`reports.html`, `reports.css`, `reports.js`).
    * `validacaoQR/`: Interface para validação rápida de pedidos e entregas via leitura de código QR (`qr-validation.html`, `qr-validation.css`, `qr-validation.js`).

* **Arquivos da Raiz de `public/`**:
  * `index.html`: Arquivo que representa a *home page* (página inicial) e funciona como o portal de entrada unificado para o ecossistema do FlashLanche.
  * `index.js`: Script principal responsável pelas interações lógicas, animações e direcionamentos da página inicial.
  * `styles.css`: Folha de estilos global contendo as variáveis de cores, padrões de tipografia e regras básicas de design visual do portal.
