# Inicializando o Luminix

O pacote `@luminix/core` do Luminix CMS oferece uma maneira robusta e flexível de configurar e inicializar seu aplicativo Laravel. Esta seção descreve como você pode inicializar o Luminix, configurá-lo e aproveitar seus recursos para melhorar a interação entre o backend e o frontend.

## Inicialização básica

Para inicializar o Luminix, você deve importar a função `app` do pacote `@luminix/core` e chamá-la. Em seguida, chame o método `boot()` para iniciar o Luminix.

```javascript
import { app } from '@luminix/core';

app().boot().then(() => console.log('Luminix iniciado com sucesso.'));
```

O método `boot()` é responsável por iniciar os containers internos do Luminix, como `Config`, `Macro`, `Auth`, e `Repository`. Além disso, realiza a configuração inicial do Axios, carrega os dados iniciais do backend e inicializa os plugins e macros personalizadas.

## Modificadores de Inicialização

### Opções de inicialização

O método boot aceita um objeto de opções que pode ser usado para personalizar a inicialização do Luminix. As opções disponíveis são:

 - `config`: Um objeto de configuração, que será acessível através do helper `config`.
 - `plugins`: Um array de plugins que serão utilizados pelo Luminix.
 - `macros`: Uma função que define e adiciona macros personalizadas ao sistema.


#### Definindo a Configuração

Durante a inicialização do Luminix é possível definir a configuração do aplicativo. A configuração é gerenciada através do helper `config`. Esta estrutura permite aos usuários acessar e definir configurações de maneira flexível e intuitiva, similar ao funcionamento do helper `config()` no Laravel.

```javascript
import { app, config } from '@luminix/core';

app().boot({
    config: {
        app: {
            name: import.meta.env.VITE_APP_NAME,
            version: '1.0.0'
        }
    },
}).then(() => console.log(`${config('app.name')} iniciado com sucesso.` ));
```

 > **Nota**: O Luminix CMS **não necessita** de uma configuração inicial para funcionar. No entanto, é altamente recomendado que você defina uma configuração inicial para personalizar o comportamento do CMS e de seus plugins.

#### Registro de Macros

O Luminix permite a adição de macros personalizadas, inspiradas nos hooks do WordPress. Isso permite que você adicione funcionalidades personalizadas ao sistema, e também estenda as funcionalidades existentes. As macros são registradas através dos métodos do container `Macro`.

```javascript
app().boot({
    macros: ({ macro }) => {
        macro.addFilter(
            'model_user_get_firstName_attribute',
            (value, user) => user.name.split(' ')[0]
        );
    }
}).then(() => console.log('Luminix iniciado com sucesso.'));
```

Veja a [documentação de macros](./1.2-Registro-de-macros.md) para mais informações sobre as macros disponíveis no `@luminix/core`. Cada plugin pode criar suas próprias macros, permitindo que você estenda o sistema de acordo com suas necessidades. Verifique a documentação de cada plugin para obter informações sobre como personalizar o seu comportamento.

#### Instalando Plugins

O Luminix também suporta a instalação de plugins para estender suas funcionalidades. Para instalar um plugin, basta importá-lo e adicioná-lo à lista de plugins no método `boot()`.

```javascript
import DayJsCastPlugin from '@luminix/dayjs-cast-plugin';

app().boot({
    plugins: [DayJsCastPlugin]
}).then(({ auth }) => {
    console.log(
        'Luminix iniciado com sucesso. Seu usário foi criado em: ', 
        auth.user().createdAt.format('DD/MM/YYYY')
    );
});
```

Verifique a [lista de plugins](./2.2-Plugins.md) para obter informações sobre os plugins disponíveis e como instalá-los. 

 > Desenvolveu um plugin? Crie um pull request para adicionar seu plugin à lista!

## Inicialização Completa

Para uma inicialização completa, você pode combinar todas as etapas anteriores. Isso permite que você defina a configuração inicial, instale plugins e adicione macros personalizadas ao sistema.

```javascript
import { app, config } from '@luminix/core';
import { MyPlugin } from '@luminix/plugin-my-plugin';

import * as jsConfig from './config';
import myMacros from './macros';

const options = {
    config: jsConfig,
    plugins: [MyPlugin],
    macros: myMacros,
};

app().boot(options).then(() => console.log(`${config('app.name')} iniciado com sucesso.` ));
```

Ao seguir estas etapas, seu aplicativo Luminix estará pronto para ser usado, oferecendo uma interação eficiente e personalizada entre o frontend e o backend do seu sistema Laravel.