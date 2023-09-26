module.exports = app => {  
    const controller = app.controllers.replay;

    app.get('/spectate/:server/:summonerName', async (req, res) => {
        let server = req.params['server'];
        let summonerName = req.params['summonerName'];

        res.status(200).send(await controller.AddSpectator(server, summonerName));
    });

    app.get('/observer-mode/rest/consumer/getGameMetaData/:platformId/:gameId/:random/token', async (req, res) => {
        let rawPlatformId = req.params['platformId'].split("-");
        let gameId = req.params['gameId'];

        let platformId = rawPlatformId[0];
        let spectatorId = rawPlatformId[1];

        let data = await controller.GetReplayData(platformId, gameId, "gameMetaData");

        if(data == undefined)
        {
            res.status(404).send();
            return;
        }

        res.status(200).send(data);
    });

    app.get('/observer-mode/rest/consumer/getGameDataChunk/:platformId/:gameId/:chunk/token', async (req, res) => {
        let rawPlatformId = req.params['platformId'].split("-");
        let gameId = req.params['gameId'];
        let chunk = req.params['chunk'];

        let platformId = rawPlatformId[0];
        let spectatorId = rawPlatformId[1];

        let data = await controller.GetReplayData(platformId, gameId, "chunk", chunk);

        if(data == undefined)
        {
            res.status(404).send();
            return;
        }

        const stream = require("stream");
        const readStream = new stream.PassThrough();

        readStream.end(data);
        res.set("Content-Length", data.byteLength);
        res.set("Content-Type", 'application/octet-stream');

        readStream.pipe(res);
    });

    app.get('/observer-mode/rest/consumer/getKeyFrame/:platformId/:gameId/:keyFrame/token', async (req, res) => {
        let rawPlatformId = req.params['platformId'].split("-");
        let gameId = req.params['gameId'];
        let keyFrame = req.params['keyFrame'];

        let platformId = rawPlatformId[0];
        let spectatorId = rawPlatformId[1];

        let data = await controller.GetReplayData(platformId, gameId, "keyFrame", keyFrame);

        if(data == undefined)
        {
            res.status(404).send();
            return;
        }

        const stream = require("stream");
        const readStream = new stream.PassThrough();

        readStream.end(data);
        res.set("Content-Length", data.byteLength);
        res.set("Content-Type", 'application/octet-stream');

        readStream.pipe(res);
    });

    app.get('/observer-mode/rest/consumer/version', async (req, res) => {
        res.status(200).send("2.0.0");
    });

    app.get('/observer-mode/rest/consumer/getLastChunkInfo/:platformId/:gameId/0/token', async (req, res) => {
        let rawPlatformId = req.params['platformId'].split("-");
        let gameId = req.params['gameId'];

        let platformId = rawPlatformId[0];
        let spectatorId = rawPlatformId[1];

        let metaJson = await controller.GetReplayData(platformId, gameId, "gameMetaData");

        if(metaJson == undefined)
        {
            res.status(404).send();
            return;
        }

        if(spectatorId != undefined)
        {
            return res.status(200).send(JSON.stringify({ chunkId: metaJson.lastChunkId, availableSince: 30000, nextAvailableChunk: 10000, keyFrameId: 1, nextChunkId: metaJson.lastChunkId - 1, endStartupChunkId: metaJson.endStartupChunkId, startGameChunkId: metaJson.startGameChunkId, endGameChunkId: metaJson.endGameChunkId, duration: 30000 }));
        }

        return res.status(200).send(JSON.stringify({ chunkId: metaJson.lastChunkId, availableSince: 0, nextAvailableChunk: 0, keyFrameId: metaJson.lastKeyFrameId, nextChunkId: metaJson.lastChunkId - 1, endStartupChunkId: metaJson.endStartupChunkId, startGameChunkId: metaJson.startGameChunkId, endGameChunkId: metaJson.endGameChunkId, duration: metaJson.pendingAvailableChunkInfo[metaJson.pendingAvailableChunkInfo.length -1].duration }));
    });
}