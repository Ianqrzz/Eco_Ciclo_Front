# Eco-Ciclo · Frontend

Frontend do Eco-Ciclo (React + Vite), em Irecê–BA.

## Como rodar

```bash
npm install
cp .env.example .env   # opcional: VITE_API_URL, padrão http://localhost:8080
npm run dev            # http://localhost:5173
```

O backend ([Eco_Ciclo_Back](https://github.com/Ianqrzz/Eco_Ciclo_Back)) precisa estar rodando.
Ele só aceita chamadas da origem `http://localhost:5173` (variável `CORS_ALLOWED_ORIGINS` do backend).

Outros comandos: `npm run lint` (oxlint) e `npm run build`.

## Telas

| Rota | Tela |
|---|---|
| `/solicitar` | Solicitar coleta: tipo de resíduo, descrição, quantidade, foto e endereço pelo GPS |
| `/solicitacao/:id` | Acompanhamento: protocolo, status e cancelamento (só antes da aceitação) |

Login, cadastro e painel da prefeitura entram como novas rotas em `src/main.jsx`.

## Integração com o login

As telas de solicitação leem o morador logado de `sessionStorage`, na chave `ecociclo.usuario`.
O login deve gravar lá o JSON devolvido por `POST /usuario/login`:

```js
sessionStorage.setItem('ecociclo.usuario', JSON.stringify(respostaDoLogin)); // { id, nome, email, perfil }
```

O botão "Sair" limpa essa chave e redireciona para `/login`. Detalhes em `src/sessao.js`.
