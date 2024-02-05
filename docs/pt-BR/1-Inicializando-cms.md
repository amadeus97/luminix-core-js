# Inicializando o Luminix

O pacote `@luminix/core` do Luminix CMS oferece uma maneira robusta e flexível de configurar e inicializar seu aplicativo Laravel. Esta seção descreve como você pode inicializar o Luminix, configurá-lo e aproveitar seus recursos para melhorar a interação entre o backend e o frontend.

## Inicialização básica

Para inicializar o Luminix, você deve importar a função `app` do pacote `@luminix/core` e chamá-la. Esta função retorna uma instância do aplicativo Luminix, que pode ser usada para configurar e inicializar o sistema. O aplicativo disponibiliza o método `boot()`. Este método é assíncrono e retorna uma Promise, que pode ser usada para executar ações após a inicialização ser concluída.

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

Durante a inicialização do Luminix é possível definir a configuração do aplicativo. Isso é feito através do método `withConfig()`, que aceita um objeto de configuração. Este objeto pode ser carregado de várias fontes, como um arquivo JavaScript ou JSON.

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

 > **Nota**: O Luminix CMS não NECESSITA de uma configuração inicial para funcionar. No entanto, é altamente recomendado que você defina uma configuração inicial para personalizar o comportamento do CMS e de seus plugins.

#### Registro de Macros

O Luminix permite a adição de macros personalizadas, inspiradas nos hooks do WordPress. Isso permite que você adicione funcionalidades personalizadas ao sistema, e também estenda as funcionalidades existentes. As macros são registradas através dos métodos do container `Macro`.

```javascript
app().boot({
    macros: (app) => {
        app('macro').addFilter(
            'model_user_get_firstName_attribute',
            (value, user) => user.name.split(' ')[0]
        )
    }
}).then(() => console.log('Luminix iniciado com sucesso.'));
```

Veja a [documentação de macros](./2.1-Macros.md) para mais informações sobre as macros disponíveis no `@luminix/core`. Cada plugin pode criar suas próprias macros, permitindo que você estenda o sistema de acordo com suas necessidades. Verifique a documentação de cada plugin para obter informações sobre como personalizar o seu comportamento.

#### Instalando Plugins

O Luminix também suporta a instalação de plugins para estender suas funcionalidades. Para instalar um plugin, basta importá-lo e adicioná-lo à lista de plugins no método `boot()`.

```javascript
import { MyPlugin } from '@luminix/plugin-my-plugin';

app().boot({
    plugins: [MyPlugin]
}).then(() => console.log('Luminix iniciado com sucesso.'));
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