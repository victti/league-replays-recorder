const app = require('./express')();
const config = require('config');

let httpPort = config.get('server.http-port')

app.http.listen(httpPort, () => {
    console.log(`Servidor http rodando na porta ${httpPort}`)
});