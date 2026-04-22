<div align="center">

# Quicklist App

[![Acessar Deploy](https://img.shields.io/badge/Acessar%20Deploy-Github%20Pages-blue?style=for-the-badge)](https://victormartinsd.github.io/quicklist-app/)
[![Figma Design](https://img.shields.io/badge/Figma%20Design-811?style=for-the-badge&logo=figma&logoColor=white&color=FC4A1A)](https://www.figma.com/design/yzuQJjidzfqhavBuPcCyvm/Lista-de-compras--Community-?node-id=3-376&p=f&t=TjeIsX5TmjHz4qCN-0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/VictorMartinsD/quicklist-app/blob/main/LICENSE)
[![Notas de Estudo](https://img.shields.io/badge/%F0%9F%93%98%20Notas%20de%20Estudo-Documenta%C3%A7%C3%A3o-0ea5e9?style=for-the-badge)](./docs/notas-de-estudo.md)

## Sumário | Summary

| Português                                                 | English                                   |
| --------------------------------------------------------- | ----------------------------------------- |
| [Sobre o Projeto](#sobre-o-projeto)                       | [About the Project](#about-the-project)   |
| [Preview](#preview)                                       | [Preview](#preview)                       |
| [Visão de Produto](#visão-de-produto)                     | [Product Vision](#product-vision)         |
| [Casos de Uso](#casos-de-uso)                             | [Use Cases](#use-cases)                   |
| [Funcionalidades](#funcionalidades)                       | [Features](#features)                     |
| [Tecnologias](#tecnologias)                               | [Technologies](#technologies)             |
| [Arquitetura](#arquitetura)                               | [Architecture](#architecture)             |
| [Como rodar localmente](#como-rodar-o-projeto-localmente) | [How to run locally](#how-to-run-locally) |
| [Limitações conhecidas](#limitações-conhecidas)           | [Known Limitations](#known-limitations)   |
| [Aprendizado](#aprendizado)                               | [Learnings](#learnings)                   |

</div>

---

## Sobre o Projeto

Quicklist App é uma aplicação web desenvolvida com JavaScript vanilla para gerenciamento de listas de compras. O projeto foi construído com foco em experiência do usuário, performance e código modular, utilizando manipulação direta do DOM e persistência local de dados.

A aplicação oferece uma interface intuitiva para criar, organizar e gerenciar múltiplas listas de compras, com funcionalidades como categorização, importação/exportação e tema claro/escuro. A arquitetura foi projetada para ser extensível e mantível, seguindo padrões modernos de desenvolvimento frontend.

<div align="center">

## Preview

  <img width="673" height="931" alt="Preview do projeto Quicklist App" src="https://github.com/user-attachments/assets/0df2b82d-0255-4030-8fce-52a3575b9add" />
</div>

## Visão de Produto

O Quicklist App resolve o problema de organização de compras do dia a dia, oferecendo uma solução digital que elimina o uso de papel e permite acesso rápido às informações em qualquer dispositivo. O produto entrega valor através de uma interface simples, organização por categorias e persistência automática dos dados.

O público-alvo são usuários que buscam produtividade e organização, desde estudantes até profissionais que fazem compras regulares.

Para detalhes sobre as regras de negócio e requisitos, acesse a [Especificação do Produto](https://github.com/VictorMartinsD/quicklist-app/blob/main/docs/PRODUCT_SPEC.md).

## Casos de Uso

- Organizar compras semanais de forma estruturada
- Gerenciar listas de diferentes eventos ou ocasiões
- Compartilhar listas entre dispositivos através de importação/exportação
- Criar categorias para separar tipos de produtos
- Manter histórico de compras anteriores para referência

## Funcionalidades

- **Gestão de Itens**: Adicionar, editar, remover e marcar itens como concluídos
- **Organização por Categorias**: Agrupar itens em categorias personalizadas
- **Múltiplas Listas**: Salvar, carregar e alternar entre diferentes listas
- **Importação/Exportação**: Compartilhar listas através de código
- **Ações em Massa**: Selecionar todos os itens e apagar múltiplos itens
- **Interface Responsiva**: Funciona em desktop e dispositivos móveis
- **Tema Claro/Escuro**: Alternância entre temas visuais
- **Modo Foco**: Interface simplificada sem distrações

<a name="tecnologias"></a>

## 🛠️ Tecnologias e Ferramentas (Análise Técnica)

### Core

| Tecnologia             | Versão    | Função                                                                                                       |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| **Vite**               | ^8.0.3    | Build tool otimizado com HMR (Hot Module Replacement) rápido, reduzindo tempo de feedback em desenvolvimento |
| **Vanilla JavaScript** | ES6       | Framework-less, modular via imports/exports, mantendo codebase leve e performático                           |
| **HTML5**              | Semântico | Estrutura acessível com proper heading hierarchy e ARIA attributes onde necessário                           |

### Styling

| Tecnologia                | Versão | Função                                                     |
| ------------------------- | ------ | ---------------------------------------------------------- |
| **CSS3**                  | Nativo | Estilização com variáveis e design tokens                  |
| **CSS Grid/Flexbox**      | Nativo | Layout responsivo e moderno                                |
| **CSS Custom Properties** | Nativo | Sistema de temas dinâmicos (claro/escuro) com persistência |

### Infrastructure / API

| Tecnologia       | Versão    | Função                                                                      |
| ---------------- | --------- | --------------------------------------------------------------------------- |
| **localStorage** | HTML5 API | Persistência de estado sem backend, carregamento instantâneo em nova sessão |
| **DOM API**      | Nativo    | Manipulação direta do DOM para performance otimizada                        |

### Tooling & Development

| Ferramenta      | Versão   | Função                                      |
| --------------- | -------- | ------------------------------------------- |
| **Prettier**    | latest   | Code formatting automático (HTML, CSS, JS)  |
| **Husky**       | ^9.1.7   | Git hooks para rodar Prettier em pre-commit |
| **lint-staged** | ^16.2.7  | Executa linting apenas em arquivos staged   |
| **npm**         | Built-in | Package manager e scripts automation        |

<a name="arquitetura"></a>

## 🏗️ Arquitetura e Decisões Técnicas

### Estrutura Modular ES6

O projeto adota uma arquitetura baseada em módulos funcionais com responsabilidades bem definidas:

```
src/js/
├── index.js                  # Ponto de entrada e orquestração principal
├── app/
│   └── constants.js          # Constantes da aplicação
├── dom/
│   └── selectors.js          # Centralização de seletores DOM
├── state/
│   └── appState.js           # Gerenciamento de estado global
├── storage/
│   └── localStorage.js       # Abstração de armazenamento local
├── utils.js                  # Utilitários reutilizáveis
└── features/                 # Módulos de funcionalidades específicas
    ├── listEvents.js         # Eventos da lista principal
    ├── modalEvents.js        # Eventos de modais
    ├── globalEvents.js       # Eventos globais da UI
    ├── importExportEvents.js # Importação e exportação
    └── manageListsEvents.js  # Gerenciamento de listas salvas
```

### Padrões de Arquitetura

**1. Module Pattern com ES6**

- Import/export explícito para dependências
- Separação clara entre interface e implementação
- Módulos coesos com responsabilidade única

**2. State Management Object-Based**

```javascript
function createAppState() {
  return {
    savedLists: [],
    activeEditableItem: null,
    draggedItemElement: null,
    pendingImportPayload: null,
    pendingDuplicateSavedListId: null,
  };
}
```

Abordagem centrada em objeto de estado que centraliza todo estado da aplicação, facilitando debug e rastreamento.

**3. DOM Element Caching**

```javascript
const el = {
  root: document.documentElement,
  itemsContainer: document.getElementById('itemsContainer'),
  // ... todos os seletores usados
};
```

Cache de referências ao DOM para evitar múltiplas queries, otimizando performance.

**4. Event Delegation Pattern**

```javascript
itemsContainer.addEventListener('click', event => {
  const removeButton = event.target.closest('.icon-button');
  if (!removeButton) return;
  // Lógica centralizada
});
```

Uso de event delegation para reduzir listeners individuais e melhorar performance.

**5. Dependency Injection**

Funções recebem dependências como parâmetros, facilitando testabilidade e desacoplamento.

**6. localStorage com Versionamento**

Chaves versionadas permitem evolução segura do schema sem conflitos de dados.

## Como rodar o projeto localmente

1. Clone o repositório:

```bash
git clone https://github.com/VictorMartinsD/quicklist-app.git
```

2. Entre no diretório do projeto:

```bash
cd quicklist-app
```

3. Instale as dependências:

```bash
npm install
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Limitações conhecidas

- Não possui sincronização entre dispositivos
- Não permite colaboração em tempo real
- Não oferece histórico de alterações
- Não possui integração com sistemas externos
- Depende do armazenamento local do navegador

## Aprendizado

O desenvolvimento deste projeto envolveu desafios significativos na organização de código vanilla JavaScript, implementação de estado global sem frameworks, e otimização de manipulação DOM. As soluções aplicadas incluíram refatoração de código monolítico para arquitetura modular, implementação de sistema de eventos centralizado, e criação de abstrações para persistência de dados.

O conhecimento adquirido abrange desde padrões de design de software até técnicas de performance e acessibilidade, resultando em uma base sólida para desenvolvimento de aplicações web complexas sem dependências externas.

Para detalhes técnicos completos, consulte as [Notas de Estudo](https://github.com/VictorMartinsD/quicklist-app/blob/main/docs/notas-de-estudo.md).

---

Desenvolvido por [Victor Martins](https://github.com/VictorMartinsD)
Front-End Developer focado em aplicações web modernas e performance.

---

> Language of this section: **English (en-US)**.

---

<div align="center">

# Quicklist App

[![Acessar Deploy](https://img.shields.io/badge/Acessar%20Deploy-Github%20Pages-blue?style=for-the-badge)](https://victormartinsd.github.io/quicklist-app/)
[![Figma Design](https://img.shields.io/badge/Figma%20Design-811?style=for-the-badge&logo=figma&logoColor=white&color=FC4A1A)](https://www.figma.com/design/yzuQJjidzfqhavBuPcCyvm/Lista-de-compras--Community-?node-id=3-376&p=f&t=TjeIsX5TmjHz4qCN-0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/VictorMartinsD/quicklist-app/blob/main/LICENSE)
[![Notas de Estudo](https://img.shields.io/badge/%F0%9F%93%98%20Notas%20de%20Estudo-Documenta%C3%A7%C3%A3o-0ea5e9?style=for-the-badge)](./docs/notas-de-estudo.md)

</div>

## About the Project

Quicklist App is a web application developed with vanilla JavaScript for shopping list management. The project was built with focus on user experience, performance, and modular code, utilizing direct DOM manipulation and local data persistence.

The application offers an intuitive interface for creating, organizing, and managing multiple shopping lists, with features such as categorization, import/export, and light/dark themes. The architecture was designed to be extensible and maintainable, following modern frontend development patterns.

## Preview

<a href="#preview">See images in the section above.</a>

## Product Vision

Quicklist App solves the problem of daily shopping organization by offering a digital solution that eliminates paper usage and allows quick access to information on any device. The product delivers value through a simple interface, category organization, and automatic data persistence.

The target audience includes users seeking productivity and organization, from students to professionals who make regular purchases.

For details on business rules and requirements, access the [Product Specification](https://github.com/VictorMartinsD/quicklist-app/blob/main/docs/PRODUCT_SPEC.md).

## Use Cases

- Organize weekly shopping in a structured way
- Manage lists for different events or occasions
- Share lists between devices through import/export
- Create categories to separate types of products
- Maintain history of previous purchases for reference

## Features

- **Item Management**: Add, edit, remove, and mark items as completed
- **Category Organization**: Group items into custom categories
- **Multiple Lists**: Save, load, and switch between different lists
- **Import/Export**: Share lists through code
- **Bulk Actions**: Select all items and delete multiple items
- **Responsive Interface**: Works on desktop and mobile devices
- **Light/Dark Theme**: Toggle between visual themes
- **Focus Mode**: Simplified interface without distractions

<a name="technologies"></a>

## 🛠️ Technologies & Tools (Technical Analysis)

### Core

| Technology             | Version  | Purpose                                                                                    |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------ |
| **Vite**               | ^8.0.3   | Optimized build tool with instant HMR (Hot Module Replacement), reducing dev feedback time |
| **Vanilla JavaScript** | ES6      | Framework-free, modular via imports/exports, keeping codebase lightweight and performant   |
| **HTML5**              | Semantic | Accessible structure with proper heading hierarchy and ARIA attributes                     |

### Styling

| Technology                | Version | Purpose                                            |
| ------------------------- | ------- | -------------------------------------------------- |
| **CSS3**                  | Native  | Styling with variables and design tokens           |
| **CSS Grid/Flexbox**      | Native  | Responsive and modern layout                       |
| **CSS Custom Properties** | Native  | Dynamic theme system (light/dark) with persistence |

### Infrastructure / API

| Technology       | Version   | Purpose                                                           |
| ---------------- | --------- | ----------------------------------------------------------------- |
| **localStorage** | HTML5 API | State persistence without backend, instant loading in new session |
| **DOM API**      | Native    | Direct DOM manipulation for optimized performance                 |

### Tooling & Development

| Tool            | Version  | Purpose                                      |
| --------------- | -------- | -------------------------------------------- |
| **Prettier**    | latest   | Automatic code formatting (HTML, CSS, JS)    |
| **Husky**       | ^9.1.7   | Git hooks for running Prettier in pre-commit |
| **lint-staged** | ^16.2.7  | Executes linting only on staged files        |
| **npm**         | Built-in | Package manager and scripts automation       |

<a name="architecture"></a>

## 🏗️ Architecture & Technical Decisions

### Modular ES6 Architecture

The project follows a functional module-based architecture with well-defined responsibilities:

```
src/js/
├── index.js                  # Entry point and main orchestration
├── app/
│   └── constants.js          # Application constants
├── dom/
│   └── selectors.js          # DOM selectors centralization
├── state/
│   └── appState.js           # Global state management
├── storage/
│   └── localStorage.js       # Local storage abstraction
├── utils.js                  # Reusable utilities
└── features/                 # Specific functionality modules
    ├── listEvents.js         # Main list events
    ├── modalEvents.js        # Modal events
    ├── globalEvents.js       # Global UI events
    ├── importExportEvents.js # Import and export
    └── manageListsEvents.js  # Saved lists management
```

### Architectural Patterns

**1. Module Pattern with ES6**

- Explicit import/export for dependencies
- Clear separation between interface and implementation
- Cohesive modules with single responsibility

**2. Object-Based State Management**

```javascript
function createAppState() {
  return {
    savedLists: [],
    activeEditableItem: null,
    draggedItemElement: null,
    pendingImportPayload: null,
    pendingDuplicateSavedListId: null,
  };
}
```

Centralized state object manages all application state, enabling easier debugging and state tracing.

**3. DOM Element Caching**

```javascript
const el = {
  root: document.documentElement,
  itemsContainer: document.getElementById('itemsContainer'),
  // ... all DOM selectors used
};
```

Cached DOM references prevent multiple queries, improving performance.

**4. Event Delegation Pattern**

```javascript
itemsContainer.addEventListener('click', event => {
  const removeButton = event.target.closest('.icon-button');
  if (!removeButton) return;
  // Centralized logic
});
```

Event delegation reduces individual listeners and improves performance.

**5. Dependency Injection**

Functions receive dependencies as parameters, facilitating testability and decoupling.

**6. localStorage with Versioning**

Versioned keys enable safe schema evolution without data conflicts.

## How to run locally

1. Clone the repository:

```bash
git clone https://github.com/VictorMartinsD/quicklist-app.git
```

2. Navigate to the project directory:

```bash
cd quicklist-app
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

## Known Limitations

- No synchronization between devices
- No real-time collaboration
- No change history
- No external system integrations
- Depends on browser local storage

## Learnings

The development of this project involved significant challenges in organizing vanilla JavaScript code, implementing global state without frameworks, and optimizing DOM manipulation. Applied solutions included refactoring monolithic code to modular architecture, implementing centralized event system, and creating abstractions for data persistence.

The acquired knowledge ranges from software design patterns to performance and accessibility techniques, resulting in a solid foundation for developing complex web applications without external dependencies.

For complete technical details, consult the [Study Notes](https://github.com/VictorMartinsD/quicklist-app/blob/main/docs/notas-de-estudo.md).

---

Developed by [Victor Martins](https://github.com/VictorMartinsD)
Front-End Developer focused on modern web applications and performance.
