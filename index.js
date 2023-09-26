require('dotenv').config();
require('./server');

const { Binary } = require('mongodb')
const mongodb = require('mongodb');

let client;

async function EntryPoint()
{
    let uri = `mongodb://${process.env['MONGODB_IP']}:${process.env['MONGODB_PORT']}`;
    client = new mongodb.MongoClient(uri);

    setTimeout(UpdateReplay, 1000);
}

async function UpdateReplay()
{
    const client = new mongodb.MongoClient(uri);

    try {
        const database = client.db("LoL");
        let recordingCollection = database.collection("Replays (recording)");
        let rawCollection = database.collection("Replays (raw)");

        let recordingData = await recordingCollection.find({}, {}).toArray();

        for(let entry of recordingData)
        {
            let server = entry.platformId.toLowerCase();

            let gameMetaData = await fetch(`http://spectator-consumer.${server}.lol.pvp.net/observer-mode/rest/consumer/getGameMetaData/${entry.platformId}/${entry.gameId}/1/token`).then(function (resp) {
                if(resp.status == 404)
                    return {error: 404}

                if(resp.status != 200)
                    return null;

                return resp.json();
            });

            if(gameMetaData.gameKey == undefined || gameMetaData.gameKey.gameId != entry.gameId || gameMetaData.gameKey.platformId != entry.platformId)
            {
                if(gameMetaData.status == 404)
                {
                    console.log("!!!!!!!!!!!!!GAME VANISHED " + entry.gameId + " " + entry.platformId);
                    await recordingCollection.deleteOne({_id: entry._id});
                }
                continue;
            }

            if(gameMetaData.gameEnded)
            {
                let cachedChunk = await rawCollection.findOne({entryType: "chunk", chunkId: gameMetaData.lastChunkId, gameId: entry.gameId, platformId: entry.platformId});
                let cachedKeyFrame = await rawCollection.findOne({entryType: "keyFrame", keyFrameId: gameMetaData.lastKeyFrameId, gameId: entry.gameId, platformId: entry.platformId});

                if(cachedChunk != null && cachedKeyFrame != null)
                {
                    console.log("!!!!!!!!!!!!!GAME ENDED " + entry.gameId + " " + entry.platformId);
                    await recordingCollection.deleteOne({_id: entry._id});
                    continue;
                }
            }

            await rawCollection.findOneAndReplace({entryType: "gameMetaData", gameId: entry.gameId, platformId: entry.platformId}, {entryType: "gameMetaData", gameId: entry.gameId, platformId: entry.platformId, data: gameMetaData}, { upsert: true });

            let lastChunkInfo = await fetch(`http://spectator-consumer.${server}.lol.pvp.net/observer-mode/rest/consumer/getLastChunkInfo/${entry.platformId}/${entry.gameId}/0/token`).then(function (resp) {
                if(resp.status != 200)
                    return null;
                
                return resp.json();
            });

            if(lastChunkInfo == null)
                continue;

            for(let chunkId = 1; chunkId <= lastChunkInfo.chunkId; chunkId++)
            {
                let cachedChunk = await rawCollection.findOne({entryType: "chunk", chunkId, gameId: entry.gameId, platformId: entry.platformId});

                if(cachedChunk != null)
                    continue;

                let chunkData = await fetch(`http://spectator-consumer.${server}.lol.pvp.net/observer-mode/rest/consumer/getGameDataChunk/${entry.platformId}/${entry.gameId}/${chunkId}/token`)
                    .then(function(resp) {
                        if(resp.status != 200)
                            return null;

                        return resp.arrayBuffer();
                    });

                if(chunkData == null)
                    continue;

                let binaryChunk = new Binary(Buffer.from(chunkData));

                await rawCollection.insertOne({entryType: "chunk", chunkId, gameId: entry.gameId, platformId: entry.platformId, file: binaryChunk});
            }

            for(let keyFrameId = 1; keyFrameId <= lastChunkInfo.keyFrameId; keyFrameId++)
            {
                let cachedKeyFrame = await rawCollection.findOne({entryType: "keyFrame", keyFrameId, gameId: entry.gameId, platformId: entry.platformId});

                if(cachedKeyFrame != null)
                    continue;

                let keyFrameData = await fetch(`http://spectator-consumer.${server}.lol.pvp.net/observer-mode/rest/consumer/getKeyFrame/${entry.platformId}/${entry.gameId}/${keyFrameId}/token`)
                    .then(function(resp) {
                        if(resp.status != 200)
                            return null;

                        return resp.arrayBuffer();
                    });

                if(keyFrameData == null)
                    continue;

                let binaryKeyFrame = new Binary(Buffer.from(keyFrameData));

                await rawCollection.insertOne({entryType: "keyFrame", keyFrameId, gameId: entry.gameId, platformId: entry.platformId, file: binaryKeyFrame});
            }

            if(gameMetaData.gameEnded && gameMetaData.lastChunkId == lastChunkInfo.chunkId && gameMetaData.lastKeyFrameId == lastChunkInfo.keyFrameId)
            {
                console.log("!!!!!!!!!!!!!GAME ENDED " + entry.gameId + " " + entry.platformId);
                await recordingCollection.deleteOne({_id: entry._id});
            }
        }
    } finally {
        await client.close();
    }

    setTimeout(() => {
        UpdateReplay();
    }, 1000);
}

EntryPoint();