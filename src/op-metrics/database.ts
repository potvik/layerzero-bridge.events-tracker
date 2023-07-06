import admin from 'firebase-admin';

const DATABASE_URL = process.env.DATABASE_URL;

export enum NETWORK_TYPE {
  ETHEREUM = 'ETHEREUM',
  BINANCE = 'BINANCE',
  ARBITRUM = 'ARBITRUM',
}

export enum OPERATION_TYPE {
  ETH_ONE = 'eth_to_one',
  ONE_ETH = 'one_to_eth',
}

export enum STATUS {
  ERROR = 'error',
  SUCCESS = 'success',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  CANCELED = 'canceled',
}

export class DBService {
  public db: admin.firestore.Firestore;

  constructor() {
    // Init admin
    try {
      const serviceAccount = require('../../keys/keys.json');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: DATABASE_URL,
      });

      this.db = admin.firestore();
      this.db.settings({ ignoreUndefinedProperties: true });
    } catch (e) {
      console.error(e);
    }
  }

  public getCollectionDataWithLimit = async (
    collectionName: string,
    orderBy: string,
    limit: number
  ): Promise<any> => {
    try {
      const snapshot = await this.db
        .collection(collectionName)
        .orderBy(orderBy, 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (err) {
      console.log('getCollectionDataWithLimit: ', err);
      return [];
    }
  };

  public getOperationsCount = async (
    filters: {
      network: NETWORK_TYPE;
      type: OPERATION_TYPE;
      status: STATUS;
    }
  ): Promise<any> => {
    try {
      const snapshot = await this.db
        .collection('operations')
        .where('type', '==', filters.type)
        .where('network', '==', filters.network)
        .where('status', '==', filters.status)
        .count()
        .get();

      return snapshot.data().count;
    } catch (err) {
      console.log('getOperationsCount: ', err);
      return [];
    }
  };
}
