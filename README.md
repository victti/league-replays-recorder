# LEAGUE REPLAYS RECORDER

Um sistema simples e direto de "gravar" os replays de partidas de League of Legends. Sistema similar foi usado no [meu site](https://victti-dev.com.br/bootcamp) com fins de gravar as partidas da LOUD durante o bootcamp na Coreia.

Contribuições são apreciadas!

**Obs: Não testei esse projeto, mas é quase uma cópia exata de como funciona no meu site.**

Bugs Conhecidos
-----------------------

 - Gravações que começarem depois de certo tempo de partida não funcionam ou mostram apenas o final da partida. (Provavelmente um bug como o GameMetaData ou LastChunkInfo funcionam)
 - Gravações não terminam quando a partida realmente acaba. (Provavelmente um bug da própria Riot, outros sites sofrem com o mesmo problema)

Instalação
-----------------------

Esse projeto usa [MongoDB](https://www.mongodb.com/) para salvar dados. Depois de baixar e instalar, você pode prosseguir.

Baixe o source e dentro da pasta use

```shell
npm install
```

Executando
-----------------------

Para poder usar esse serviço, você precisa de uma [chave de desenvolvedor da Riot](https://developer.riotgames.com/docs/portal). Sem a chave, o serviço não consegue salvar a chave de spectator da partida.

São usadas 3 variáveis de ambiente: `MONGODB_IP`, `MONGODB_PORT` e `RIOT_API_KEY`. Depois de criar um `.env` ou usar o console para atribuir, basta executar o serviço:

```shell
node index.js
```

ou

```shell
nodemon index.js
```

Como Usar
-----------------------

Para salvar um replay acesse e mude as variáveis `:server` e `:summonerName` para o servidor e o nick da conta que queira salvar o replay.

```shell
http://localhost/spectate/:server/:summonerName
```

Para assistir um replay, na pasta do jogo abra o terminal e execute mudando as variáveis `:CHAVE_SPEC`, `:ID_DA_PARTIDA`, `:REGIAO`:

```shell
League of Legends.exe "spectator localhost:80 :CHAVE_SPEC :ID_DA_PARTIDA :REGIAO-%RANDOM%%RANDOM%" -UseRads -GameBaseDir=.. "-Locale=%locale%"
```

Atualmente não tenho um jeito limpo de mostrar essas variáveis, para usuários avançados basta fazer uma query no mongodb para descobrir uma partida.

## Considerações Finais

Esse projeto não é endossado pela Riot Games e não reflete os pontos de vista ou opiniões da Riot Games ou de qualquer pessoa oficialmente envolvida na produção ou gerenciamento de League of Legends.