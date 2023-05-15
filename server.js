import { createServer } from "http";
import { SetSumFork } from "./set-sum-fork.js";

createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sum = Number(url.searchParams.get('sum'));
  const set = url.searchParams.get('set').split(',').map(Number);

  const subsetSum = new SetSumFork(sum, set);

  subsetSum.on('match', data => {
    res.write(`Match found: ${data}`);
  });

  subsetSum.on('end', () => {
    res.end('End of search');
  });

  subsetSum.start();
}).listen(3000, () => console.log('Server started'));
