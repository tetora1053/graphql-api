interface DataStore {
  getConnection():void;
  getNameById(id: number);
}

class MysqlStrategy implements DataStore {
  private util;
  private pool;
  getConnection() {
    console.log("mysql connect.");
    var mysql = require('mysql');
    this.util = require('util');
    this.pool = mysql.createPool({
      host     : 'localhost',
      user     : 'shinoda',
      password : 'shinodapass',
      database : 'graphql'
    });
  }
  async getNameById(id: number) {
    this.pool.query = this.util.promisify(this.pool.query);
    var results = await this.pool.query('SELECT * FROM user WHERE id = ' + id);
    return results[0].name;
  }
}

class RedisStrategy implements DataStore {
  private client;
  getConnection() {
    console.log("redis connect.");
    var redis = require("redis");
    this.client = redis.createClient();
  }
  async getNameById(id: number) {
    const {promisify} = require('util');
    const getAsync = promisify(this.client.get).bind(this.client);
    return await getAsync(id);
  }
}

class DataManager {
  private data_store: DataStore;
  constructor(data_store: DataStore) {
    this.data_store = data_store;
    this.data_store.getConnection();
  }
  getNameById(id: number) {
    return this.data_store.getNameById(id);
  }
}

const data_manager = new DataManager(new RedisStrategy());
/*
(async function () {
  console.log('name:', await data_manager.getNameById(2));
}());
*/

const { ApolloServer, gql } = require('apollo-server');

// The GraphQL schema
const typeDefs = gql`
  type Query {
    name(id: Int!): String
  }
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    name: (parent, args, context, info) => data_manager.getNameById(args.id)
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen(5000, () => {
  console.log(`🚀 Server ready at 5000`);
});
