# Flor de Margarida

Loja virtual de moda feminina. Site estático em HTML, CSS e JavaScript puro, sem build.

## Como rodar

Abra `index.html` no navegador ou sirva a pasta com qualquer servidor estático:

```bash
python -m http.server 8080
```

## Estrutura

- `index.html` - página inicial (hero, categorias, novidades, mais amadas)
- `produtos.html` - catálogo com filtros e ordenação
- `produto.html` - página da peça (cores, tamanhos, guia de medidas)
- `provador.html` - provador virtual
- `carrinho.html` / `checkout.html` - sacola e finalização da compra
- `sobre.html` / `contato.html` - institucional e atendimento
- `customize.html` - redireciona ao painel de administração em `index.html#customize`
- `assets/css/style.css` - estilos
- `assets/js/` - dados, lógica da loja, componentes, provador e painel Customize

## Categorias

A árvore do menu fica em `assets/js/dados.js` (`DEPARTAMENTOS`): Roupas (Partes de Cima,
Peças Únicas, Partes de Baixo, Inverno / Sobreposição) e Acessórios. Cada departamento e
grupo tem descrição de SEO e palavras-chave, usadas nas metatags do catálogo e na busca.
O catálogo aceita `?departamento=`, `?grupo=`, `?categoria=` e `?subcategoria=` na URL.
