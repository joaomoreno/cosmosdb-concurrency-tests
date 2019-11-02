import { CosmosClient } from '@azure/cosmos';

const opts = require('../key.json');

interface Counter {
  value: number;
}

async function testMultipleClients(): Promise<void> {
  const id = '' + new Date();

  const client = new CosmosClient(opts);
  await client.database('tests').container('counters').items.create({ id, value: 0 });
  console.log('Created document', id);

  async function work(id: string): Promise<void> {
    for (let i = 0; i < 10; i++) {
      console.log(i);
      const client = new CosmosClient(opts);
      const item = await client.database('tests').container('counters').item(id, id);
      const res = await item.read<Counter>();
      const counter = res.resource;
      counter.value++;
      await item.replace(counter);
      await new Promise(c => setTimeout(c, 100 + Math.random() * 100));
    }
  }

  const promises = [
    work(id),
    work(id),
    work(id),
    work(id),
    work(id)
  ];

  await Promise.all(promises);
  console.log('Done');

  const item = await client.database('tests').container('counters').item(id, id);
  const res = await item.read<Counter>();
  const counter = res.resource;
  console.log('counter:', counter.value);
}

async function testSProc(): Promise<void> {
  const id = '' + new Date();

  const client = new CosmosClient(opts);
  await client.database('tests').container('counters').items.create({ id, value: 0 });
  console.log('Created document', id);

  async function work(id: string): Promise<void> {
    for (let i = 0; i < 10; i++) {
      console.log(i);
      const client = new CosmosClient(opts);

      const sproc = await client.database('tests').container('counters').scripts.storedProcedure('increment');
      await sproc.execute(id, [id]);
      console.log(i);
      await new Promise(c => setTimeout(c, 100 + Math.random() * 100));
    }
  }

  const promises = [
    work(id),
    work(id),
    work(id),
    work(id),
    work(id)
  ];

  await Promise.all(promises);
  console.log('Done');

  const item = await client.database('tests').container('counters').item(id, id);
  const res = await item.read<Counter>();
  const counter = res.resource;
  console.log('counter:', counter.value);
}

async function main(): Promise<void> {
  // await testMultipleClients();
  await testSProc();
}

main().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  }
)