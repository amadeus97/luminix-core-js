# Luminix JS Core

> Projeto em desenvolvimento

[Site do Luminix CMS](https://luminix.arandutech.com.br)

Este pacote é parte do Luminix CMS, um sistema de gerenciamento de conteúdo para Laravel. Este pacote contém:
 - comunicação com o backend do Luminix CMS;
 - fornece classes para os Models definidos no backend para serem utilizadas no frontend;
 - fornece um mecanismo de Macros para o frontend, inspirado nos hooks do WordPress;
 - fornece funções helper, algumas análogas às funções do Laravel: `route()`, `config()`, `auth()`, `error()` e `model()`.

## Instalação

```bash
npm install @luminix/core
```

## Roadmap

 - [Inicializando o `Luminix`](./docs/pt-BR/1-Inicializando-cms.md)
    - [Definindo a configuração](./docs/pt-BR/1.1-Definindo-configuracao.md)
    - Registro de Macros
    - Instalando Plugins
 - Utilizando os Models
 - Macros
    - Conceito
    - Definindo Macros
    - Personalizando o CMS
    - Listagem de Macros
 - Funções Helper
    - `route()`
    - `auth()`
    - `config()`
    - `error()`


