let mongodb = require('mongodb');

const apiKey = process.env['RIOT_API_KEY'];

const uri = `mongodb://${process.env['MONGODB_IP']}:${process.env['MONGODB_PORT']}`;

async function AddSpectator(server, summonerName)
{
    if(apiKey == undefined)
        return "RIOT API KEY MISSING";

    let saneServer = GetSaneServer(server);

    let summonerData = await GetSummonerData(saneServer, summonerName);
    if(summonerData.status == undefined)
    {
        let specData = await GetSpectateData(summonerData.id, saneServer);

        if(spectatorData.status == undefined)
        {
            await QueueSpectatorData(specData);
            return "OK";
        }
    }

    return "ERROR";
}

async function GetReplayData(platformId, gameId, entryType, dataId)
{
    let output = undefined;

    const client = new mongodb.MongoClient(uri);

    try {
        const database = client.db("LoL");
        let replayCollection = database.collection("Replays (raw)");

        let entry = undefined;

        if(dataId == undefined)
        {
            entry = await replayCollection.findOne({gameId: Number(gameId), platformId, entryType}, {})
        } else if(entryType == "chunk")
        {
            entry = await replayCollection.findOne({gameId: Number(gameId), platformId, entryType, chunkId: Number(dataId)}, {})
        } else if(entryType == "keyFrame")
        {
            entry = await replayCollection.findOne({gameId: Number(gameId), platformId, entryType, keyFrameId: Number(dataId)}, {})
        }

        if(entry != undefined)
        {
            if(entryType == "chunk" || entryType == "keyFrame")
            {
                output = entry.file.buffer;
            } else {
                output = entry.data;
            }
        }
    } finally {
        await client.close();
    }

    return output;
}

// DB FUNCTIONS

async function QueueSpectatorData(specData)
{
    const client = new mongodb.MongoClient(uri);

    try {
        const database = client.db("LoL");
        let replayCollection = database.collection("Replays (spectator)");
        let recordingCollection = database.collection("Replays (recording)");

        let filter = { gameId: specData.gameId, platformId: specData.platformId };

        replayCollection.replaceOne(filter, specData, { upsert: true });
        await recordingCollection.replaceOne(filter, filter, { upsert: true });

    } finally {
        await client.close();
    }
}

// LEAGUE FUNCTIONS

async function GetSpectateData(server, summonerId)
{
    let spectatorData = await fetch(`https://${server}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}`, {headers: {'X-Riot-Token': apiKey}}).then(function (response) {
        return response.json();
    }).then(async function(json)
    {
        return json;
    });
}

async function GetSummonerData(server, summonerName)
{
    return await fetch(`https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`, {headers: {'X-Riot-Token': apiKey}}).then(function (response) {
        return response.json();
    }).catch(function(err)
    {
        console.warn('Something went wrong.', err);
    });
}

// HELPERS

function GetRegion(server)
{
  switch(server.toUpperCase())
  {
    case "BR1":
    case "LA1":
    case "LA2":
    case "NA1":
    case "OC1":
      return "americas";
    case "JP":
    case "KR":
      return "asia";
    case "EUN1":
    case "EUW1":
    case "RU":
    case "TR1":
      return "europe";
    case "TW2":
      return "sea";
  }

  return null;
}

function GetSaneServer(server)
{
    switch (server.toUpperCase())
    {
      case "BR":
      case "EUN":
      case "EUW":
      case "JP":
      case "NA":
      case "OC":
      case "TR":
        return server + "1";
      case "BR1":
      case "EUN1":
      case "EUW1":
      case "JP1":
      case "KR":
      case "LA1":
      case "LA2":
      case "NA1":
      case "OC1":
      case "PH2":
      case "RU":
      case "SG2":
      case "TH2":
      case "TR1":
      case "TW2":
      case "VN2":
        return server;
      case "LA":
        return "LA1";
    }

    return null;
}

module.exports = { AddSpectator, GetReplayData }