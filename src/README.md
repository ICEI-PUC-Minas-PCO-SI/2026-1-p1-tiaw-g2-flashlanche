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

Para a montagem do site, devem ser editados os arquivos existentes e criados novos arquivos na pasta `public`, que abriga todos os componentes da interface do front-end, visíveis ao usuário no navegador.

Na pasta `public`, sugere-se a seguinte organização dos arquivos do site:

* Pasta `assets`: destinada aos arquivos de formatação (CSS), scripts (JS), imagens utilizadas no site (JPG, PNG, GIF, SVG etc.), fontes (TTF) e outros arquivos gerais utilizados por todo o site.
* Pasta `modulos`: onde devem ser armazenados os arquivos relacionados à implementação das funcionalidades do site. Recomenda-se criar uma subpasta para cada novo módulo ou funcionalidade, o que também pode facilitar a divisão do trabalho entre os membros do grupo.
* Arquivo `index.html`: arquivo que representa a "home page" do site.
