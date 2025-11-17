# axe-core-validacao
Projeto simples que mostra como utilizar o axe-core para validar um conjunto de páginas. É possível criar cenários para interagir com a página antes de realizar a análise.

# instalação

```shell
npm i
```

# Configuração
Abra o arquivo [config.json](config.json) e preencha:

- Caso suas páginas não precisem de login, pode apagar essa parte

Você pode definir apenas o objeto páginas, para páginas que não precisem de interação antes da análise.

Caso seja necessário interagir (seja para revelar um menu ou diálogo/modal), utilize o objeto cenarios

# Execução
```shell
npm run start
```