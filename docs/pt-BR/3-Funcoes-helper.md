# Funções Helper

Todas as funcionalidades do Luminix são acessadas através das funções helper. Algumas destas funções são análogas às funções do Laravel, e outras são específicas do Luminix.

## `app()`

A função `app()` retorna a instância do aplicativo Luminix. Esta instância é utilizada para inicializar o aplicativo. Ela também aceita um string como argumento que permite acessar os facades do Luminix.

```typescript
app(): App;
app<T extends keyof AppFacades>(facade: T): AppFacades[T];
```

Exemplo:

```javascript
import { app } from '@luminix/core';

// Inicializando o app
app().boot().then(() => {
    // Acessando o facade `Auth`
    const auth = app('auth');
    auth.user().name; // John Doe
});
```

## `auth()`

A função `auth()` retorna a instância do facade `Auth`. Este facade é utilizado para autenticar usuários, para acessar informações sobre o usuário autenticado e outras ações relacionadas à autenticação.

```typescript
auth(): Auth;
```

Exemplo:

```javascript
import { auth } from '@luminix/core';

// Verificando se o usuário está autenticado
if (auth().check()) {
    auth().id(); // 1
    auth().user().name; // John Doe
    auth().logout(); // Logout do usuário
}
```

## `config()`

A função `config()` retorna a configuração do aplicativo. Esta configuração é definida durante a inicialização do aplicativo, e é acessível em todo o aplicativo. É análoga ao helper `config()` do Laravel. Pode ser chamada com um argumento para acessar uma chave específica da configuração, ou sem argumentos para acessar o facade `Config`.

```typescript
config(): Config;
config(key: string, defaultValue?: any): any;
```

Exemplo:

```javascript
import { config } from '@luminix/core';

// Acessando a configuração
config('app.name'); // Luminix CMS

// Obtendo uma configuração com valor padrão
config('app.debug', false);

// Definindo uma nova configuração
config().set('app.debug', true);

// Removendo uma configuração
config().delete('app.debug');

// Bloqueando uma configuração
config().lock('app.name');

// Verificando se uma configuração existe
config().has('app.name'); // true

// Obtendo todas as configurações
config().all();

// Mesclando uma configuração
config().merge('app', { debug: true });
```

## `error()`

A função `error()` captura erros de formulários submetidos para o backend, após o redirecionamento de volta para o frontend. Esta função é utilizada para exibir mensagens de erro para o usuário. Tem a função similar à diretiva blade `@error` do Laravel.

```typescript
error(name: string): string | null;
error.clear(name?: string): void;
```

Exemplo:

```javascript
import { error } from '@luminix/core';

// Exibindo um erro
error('name'); // O campo nome é obrigatório.
```

## `log()`

A função `log()` é utilizada para exibir mensagens de log no console do navegador. Somente executará se a configuração `app.debug` estiver definida como `true`.

```typescript
log(): LogFacade;
log(...args: any[]): void;
```

Exemplo:

```javascript
import { log } from '@luminix/core';

// Exibindo uma mensagem de log
log('Usuário autenticado com sucesso.');
log().warning('Usuário não deu estrela no repositório.');
```

## `model()`

A função `model()` retorna a instância de um modelo. Esta função é utilizada para interagir com os modelos do backend, como criar, atualizar, deletar e obter dados dos modelos. Ela poderá ser chamada com um argumento para retornar a instância de um modelo específico, ou sem argumentos para acessar o facade `Repository`.

```typescript
model(): Repository;
model(name: string): typeof Model;
```

Exemplo:

```javascript
import { model } from '@luminix/core';

// Obtendo a classe de um modelo
const User = model('user');
// Obtendo as configurações de um modelo
const schema = model().getClassSchema('user');
```

## `route()`

A função `route()` retorna a URL de uma rota nomeada. Esta função é utilizada para acessar as rotas nomeadas do backend, e é análoga à função `route()` do Laravel.

```typescript
route(name: string, parameters?: object): string;
route.exists(name: string): boolean;
```

Exemplo:

```javascript
import { route } from '@luminix/core';

// Acessando URL de uma rota sem parâmetros
route('luminix.user.list'); // /api/users

// Acessando a URL de uma rota com parâmetros
route('luminix.user.item', { id: 1 }); // /api/users/1

// Acessando a URL de uma rota que tem parâmetros, sem substituir os parâmetros
route('luminix.user.item'); // /api/users/{id}
```

