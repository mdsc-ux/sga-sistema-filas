# SGA - Sistema de Gerenciamento de Atendimento

Um sistema completo, robusto e moderno de gerenciamento de filas e atendimento em tempo real (SGA). Desenvolvido utilizando **Node.js**, **Express**, **Socket.io** e tecnologias web padrão (HTML5, CSS3, JavaScript Vanilla).

O sistema conta com comunicação em tempo real para sincronizar a emissão de senhas, chamadas no painel de TV, atendimento pelos operadores e acompanhamento do status da fila pelos clientes via celular.

---

## 🚀 Funcionalidades

O sistema é dividido em diferentes interfaces integradas:

1. **Totem de Autoatendimento (`totem.html`)**:
   * Emissão de senhas personalizadas (ex: Normal, Preferencial, Triagem).
   * Impressão/Visualização da senha gerada com QR Code para acompanhamento pelo celular.

2. **Painel de Exibição / TV (`dashboard.html`)**:
   * Exibição das senhas chamadas em tempo real com alertas sonoros e transições suaves.
   * Histórico das últimas senhas chamadas.
   * Divisão visual por guichê/sala e tipo de atendimento.

3. **Painel do Operador & Administração (`admin.html`)**:
   * Autenticação de operadores e configuração de unidades de atendimento.
   * Painel de controle para chamar a próxima senha da fila, rechamar ou finalizar o atendimento atual.
   * Estatísticas de tempo médio de espera, atendimentos concluídos e distribuição de filas em tempo real.

4. **Acompanhamento Remoto (`remote.html`)**:
   * Permite que o cliente escaneie o QR Code impresso no totem e acompanhe de forma remota a sua posição na fila diretamente no celular, evitando aglomerações na sala de espera.

---

## 🛠️ Tecnologias Utilizadas

* **Back-end:**
  * Node.js
  * Express (Roteamento de API REST)
  * Socket.io (Comunicação bidirecional e eventos em tempo real)
  * UUID (Geração de IDs únicos)
* **Front-end:**
  * HTML5 Semântico
  * CSS3 Vanilla (Design responsivo e transições suaves)
  * JavaScript Vanilla (Integração com API e WebSockets)

---

## 📁 Estrutura do Projeto

```text
FILAS/
├── public/                # Páginas estáticas do Front-end
│   ├── index.html         # Página inicial do sistema
│   ├── totem.html         # Emissão de senhas
│   ├── dashboard.html     # Painel de exibição (TV)
│   ├── admin.html         # Painel de controle do Operador/Admin
│   ├── remote.html        # Acompanhamento remoto por celular
│   └── styles.css         # Estilização global e componentes
├── src/                   # Código-fonte do Back-end
│   ├── controllers/       # Controladores de Requisições e lógica da API
│   ├── repositories/      # Camada de persistência/armazenamento de dados
│   ├── services/          # Regras de negócio do sistema
│   └── server.js          # Arquivo de inicialização do servidor Express + Socket.io
├── package.json           # Dependências e scripts do Node.js
└── .gitignore             # Arquivos ignorados pelo Git
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos
* Ter o **Node.js** (versão 16 ou superior) instalado em sua máquina.

### Passos para rodar o projeto:

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   *O servidor iniciará utilizando o `nodemon`, reiniciando automaticamente a cada alteração de arquivo.*

3. **Acesse a aplicação no navegador:**
   * **Página Inicial:** [http://localhost:3000](http://localhost:3000)
   * **Totem de Senhas:** [http://localhost:3000/totem.html](http://localhost:3000/totem.html)
   * **Painel de Chamadas:** [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)
   * **Painel Administrativo:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 📄 Licença
Este projeto é de uso livre e acadêmico para fins de desenvolvimento de software e gerenciamento de filas de atendimento.
