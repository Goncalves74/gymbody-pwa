# Testes automáticos GymBody

O workflow **GymBody - testes de qualidade** corre em cada push, pull request e manualmente em **GitHub → Actions**.

Abrir o workflow, escolher **Run workflow** para repetir os testes. O resultado verde significa que os testes automatizados definidos passaram; não equivale a uma validação completa do Safari iOS.

## Cobertura inicial
- Abertura e navegação nos principais ecrãs, sem erros JavaScript não tratados.
- Contraste mínimo 4,5:1 do título da ficha do Atlas, em claro/escuro/automático.
- Capturas do Atlas para análise visual.
- Persistência local de um cliente fictício e de um pagamento após recarregar.

## Executar num computador
Instalar Node.js 22 e Python 3, depois:
```sh
npm install
npx playwright install chromium
npm run test:e2e
```

Os testes utilizam um navegador Chromium com dimensões de iPhone e um Chrome de desktop. **Não executam Safari real ou simulador iOS**. A aplicação publicada mantém os dados exclusivamente no navegador; os testes usam dados fictícios isolados.

Os relatórios e capturas são disponibilizados nos artefactos de cada execução do GitHub Actions. Os testes não garantem ausência de erros e a cobertura será ampliada progressivamente.
