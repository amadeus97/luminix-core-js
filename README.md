# Luminix JS Core

> Projeto em desenvolvimento

[Site do Luminix CMS](https://luminix.arandutech.com.br)

Este pacote é parte do Luminix CMS, um sistema de gerenciamento de conteúdo para Laravel. Este pacote contém:
 - comunicação com o backend do Luminix CMS;
 - fornece classes para os Models definidos no backend para serem utilizadas no frontend;
 - fornece um mecanismo de Macros para o frontend, inspirado nos hooks do WordPress;
 - fornece funções helper, algumas análogas às funções do Laravel, e outras específicas do Luminix.

## Instalação

```bash
# Para o Backend
composer require luminix/cms
# Para o frontend
npm install @luminix/core
```
 > Verifique a documentação do `luminix/cms` para mais informações sobre a instalação do backend.

## Documentação

 - [Inicializando o `Luminix`](./docs/pt-BR/1-Inicializando-cms.md)
    - [Definindo a configuração](./docs/pt-BR/1.1-Definindo-configuracao.md)
    - [Registro de Macros](./docs/pt-BR/1.2-Registro-de-macros.md)
    - [Instalando Plugins](./docs/pt-BR/1.3-Instalando-plugins.md)
 - [Utilizando os Models](./docs/pt-BR/2-Utilizando-models.md)
 - [Funções Helper](./docs/pt-BR/3-Funcoes-helper.md)
 - [API](./docs/pt-BR/4-API.md)
