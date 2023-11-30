import * as mongoDB from "mongodb";
export const collections: { games?: mongoDB.Collection } = {}
export async function connectToDatabase () {

    // create the mongo client
    const client: mongoDB.MongoClient = new mongoDB.MongoClient("mongodb://localhost:27017");
    // connect to it
    await client.connect();
    // create the database
    const db: mongoDB.Db = client.db('gamesDB');

    const gamesCollection: mongoDB.Collection = db.collection('games');

    collections.games = gamesCollection;

    console.log(`Successfully connected to database: ${db.databaseName} and collection: ${gamesCollection.collectionName}`);
}