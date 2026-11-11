# GymBody PWA

Protótipo de gestão de clientes, biblioteca de exercícios, planos individuais e registo de treinos realizados, em português de Portugal.

## Utilização

Após ativar **Settings → Pages → Build and deployment → Source: GitHub Actions**, a aplicação estará em:

https://goncalves74.github.io/gymbody-pwa/

No iPhone: Safari → Partilhar → Adicionar ao ecrã principal.

## Dados e limitações

- Os dados são guardados em `localStorage` **apenas neste navegador/dispositivo**.
- Não há sincronização entre dispositivos nem autenticação de utilizadores.
- A importação de uma cópia JSON substitui os dados existentes.
- A exportação JSON permite guardar cópias de segurança.
- Não introduzir dados reais de saúde ou dados sensíveis de clientes nesta versão experimental.
- Os treinos são registados manualmente; não existe integração Bluetooth.

## Estrutura

- `index.html` — interface
- `style.css` — estilos responsivos
- `app.js` — lógica de clientes, exercícios, planos, treinos e cópias de segurança
- `manifest.webmanifest`, `sw.js`, `icon.svg` — instalação PWA e utilização offline
- `.github/workflows/pages.yml` — publicação no GitHub Pages

## Próximas etapas

Testes funcionais em iOS/Android, validação dos fluxos com o PT, evolução dos relatórios, controlo de acesso e armazenamento seguro adequado ao tratamento de dados pessoais.
