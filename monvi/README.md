# Monvi: site da loja

Site de uma página para a Monvi, loja de roupas fitness que não ficam transparentes e são confortáveis.
É um único arquivo (`index.html`) com HTML, CSS e JavaScript. Não precisa instalar nada: basta abrir no navegador ou publicar em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel).

## O que tem na página

- **Teste do agachamento:** um controle deslizante que estica o tecido e compara uma legging comum com a Monvi.
- **Coleção:** produtos com filtro por categoria, escolha de cor e de tamanho.
- **Sacola:** fica salva no navegador da cliente, mostra quanto falta para o frete grátis e envia o pedido pronto pelo WhatsApp.
- Guia de medidas, perguntas frequentes, cadastro de e-mail e rodapé.

## O que editar antes de publicar

Tudo fica no começo do `<script>` em `index.html`:

| O quê | Onde |
| --- | --- |
| Número do WhatsApp que recebe os pedidos | `CONFIG.whatsapp` (só dígitos, com 55 e DDD) |
| Valor mínimo do frete grátis | `CONFIG.freteGratisAcima` |
| Cores disponíveis | `CORES` |
| Produtos, preços e descrições | `PRODUTOS` |

Também vale revisar:

- O link do Instagram no rodapé.
- Os textos de trocas, prazos e composição do tecido, para que batam com a política real da loja.
- O formulário de e-mail, que ainda não salva os cadastros em lugar nenhum. Para isso, conecte-o a um serviço como Mailchimp, Brevo ou RD Station.
- As peças são desenhos simples em SVG. Quando tiver fotos, troque o `svgPeca(p.forma)` do card por uma tag `<img>`.
