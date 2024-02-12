# Utilizando os Models

O Luminix fornece uma maneira fácil de utilizar os Models do backend no frontend. Isso permite que você crie aplicações com uma arquitetura de dados consistente, aproveitando regras definidas no backend, como relacionamentos, atributos preenchíveis, casts definidos, etc.

## Convenções

Sempre que um modelo é chamado através de uma string, ele deve ser escrito em `snake_case`. Por exemplo, se você tem um modelo chamado `User`, você deve chamá-lo como `user`, `UserProfile` como `user_profile`, e assim por diante.

## Utilizando um Model

Para obter a classe de um Model, utilize a função `model()` do pacote `@luminix/core`. Esta função aceita o nome do Model como argumento, e retorna uma instância do Model. Este modelo é análogo ao modelo Eloquent do Laravel, e possui métodos para interagir com o backend.

```javascript
import { model } from '@luminix/core';

const User = model('user');
// also valid:
// class User extends model('user') {};

const user = new User({ name: 'John Doe' });

user.name = 'Jane Doe';
user.email = 'janedoe@example.com';
user.password = 'super strong password';

user.save().then(() => console.log('Usuário salvo com sucesso.'));
```

Ao executar o código acima, o Luminix irá enviar uma requisição para o backend, que irá criar um novo usuário com os dados fornecidos. Após a criação, o Luminix irá atualizar o modelo com os dados retornados pelo backend, incluindo o `id` do usuário.

## Obtendo dados do backend

Para obter dados do backend, utilize a função `get()` da classe `Model`. Esta função aceita um objeto de parâmetros, e retorna uma Promise que resolve com dados de paginação e um array de instâncias do Model.

```javascript
import { model } from '@luminix/core';

const { data: users } = await model('user').get({ per_page: 10 });
// also valid:
// const { data: users } = await User.get({ per_page: 10 });

console.log(users[0].name); // John Doe
```

Também é possível utilizar a função `find()` para obter um único modelo. Esta função aceita o `id` do modelo como argumento, e retorna uma Promise que resolve com uma instância do Model.

```javascript
import { model } from '@luminix/core';

const user = await model('user').find(1);
// also valid:
// const user = await User.find(1);

user.name = 'Jane Doe';
user.save().then(() => console.log('Usuário salvo com sucesso.'));
```

## Atributos

Os atributos de um modelo são acessados como propriedades do modelo. O Luminix irá automaticamente converter os atributos do backend para camelCase, e vice-versa.

```javascript
const user = new User({ name: 'John Doe', avatar_src: 'https://example.com/avatar.jpg' });

console.log(user.name); // John Doe
console.log(user.avatarSrc); // https://example.com/avatar.jpg
```

## Relacionamentos

Os relacionamentos de um modelo são acessados como propriedades do modelo. Se o modelo tiver os relacionamentos pré-carregados, o Luminix irá automaticamente converter os dados do backend para instâncias de modelos.

```javascript
const user = new User({ name: 'John Doe', posts: [{ id: 1, title: 'Lorem Ipsum', content: 'Hello, World' }] });
const post = user.posts[0];

console.log(post.title); // Lorem Ipsum

post.title = 'Hello, World';
post.save().then(() => console.log('Post salvo com sucesso.'));
```

 > Os relacionamentos devem ter seus métodos de acesso definidos no modelo Eloquent, utilizando dicas de tipo. Isso permite que o Luminix saiba como converter os dados do backend para instâncias de modelos.

## Casts

Os casts de um modelo são definidos no modelo Eloquent, e são automaticamente aplicados pelo Luminix. Isso permite que você utilize os atributos do modelo de maneira consistente, sem se preocupar com a formatação dos dados.

```javascript
const user = new User({ name: 'John Doe', created_at: '2021-01-01T00:00:00.000Z' });

console.log(user.createdAt); // Date { 2021-01-01T00:00:00.000Z }
console.log(user.createdAt.toLocaleDateString()); // 01/01/2021
```

 > Os campos de timestamps do Laravel são automaticamente convertidos para instâncias de `Date` pelo Luminix.
 > Plugins podem adicionar suporte para outros tipos de cast, como o `Day.js`.

## Proxy - A camada "mágica"

O Luminix utiliza um Proxy para interceptar as chamadas de métodos e propriedades do modelo. Isso permite que o Luminix adicione funcionalidades ao modelo, como a conversão de atributos, relacionamentos e casts. Ao utilizar o helper `model()`, o Luminix irá retornar uma instância do modelo com o Proxy já configurado.

```javascript
const Post = model('post');

const post = new Post({ title: 'Hello, World', thumbnail_src: 'https://example.com/thumbnail.jpg' });

console.log(post.attributes); // { title: 'Hello, World', thumbnail_src: 'https://example.com/thumbnail.jpg' }
console.log(post.title); // Hello, World
console.log(post.thumbnailSrc); // https://example.com/thumbnail.jpg
```

Ao acessar uma propriedade de um modelo, o Luminix leva em conta os seguintes parâmetros, nesta ordem:

 - Se a propriedade existe no modelo base, ela é retornada.
 - Se a propriedade corresponde a um relacionamento, o Luminix irá retornar uma instância ou um array de instâncias do modelo relacionado.
 - Se existe uma macro registrada com o nome `model_{model}_call_{method}_method`, ela é executada e retornada.
 - Se a propriedade existe no `attributes` do modelo, ela é retornada com o filtro `model_{model}_get_{attribute}_attribute`.
 - Se existe uma macro registrada com o nome `model_{model}_get_{attribute}_attribute`, o Luminix irá retornar o valor do atributo convertido.

Durante este processo de acesso, o Luminix irá converter automaticamente as propriedades para `snake_case` e vice-versa, e aplicar os casts definidos no modelo Eloquent.

## Próximos Passos

Veja como utilizar as [funções helper](./3-Funcoes-helper.md) do Luminix para criar aplicações mais complexas, ou aprofunde-se na [Model API](./4.3.1-Model.md) para entender todas as funcionalidades disponíveis.

