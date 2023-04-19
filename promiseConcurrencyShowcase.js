/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
let immediateResolve: Promise<number>,
  nonPromise: number,
  timeoutPromise: Promise<string>;

function setPromises() {
  immediateResolve = Promise.resolve(3);
  nonPromise = 42;
  timeoutPromise = new Promise((resolve, _) => {
    setTimeout(resolve, 1000, "Resolved after timeout");
  });
}

/* All of them start the Promises concurrently (not in parallel necessarily!). They all ignore non-promises.

- all(): Resolves only if all promises resolve. Early reject if any one promise rejects.
    Returns an array of the settled values in the order they were inserted, not settled.
    Promise.all() resolves synchronously if and only if the iterable passed is []. Even if you pass [1,'abc',{}], it will resolve asynchronously.

- allSettled(): Resolves only if all promises resolve. Reject if any one promise rejects BUT WAITS FOR ALL OTHERS TO FINISH.
    Returns an array of the settled stati and values in the order they were inserted, not settled.

- any(): Resolves if any promise resolves. Rejects only if all the promises reject (opposite to all()).
    Returns the first resolved value.

- race(): Rejects or resolves according to whatever the first settled promise does.
    Returns the first settled value.
*/
async function tryPromiseAll() {
  setPromises();
  const result = await Promise.all([
    immediateResolve,
    nonPromise,
    timeoutPromise,
  ]);
  console.log("Promise.all 1: ", result); // Expected output (after at least 1000ms): Array [3, 42, "foo"]

  setPromises();
  try {
    const resultWithRejection = await Promise.all([
      immediateResolve,
      nonPromise,
      timeoutPromise,
      Promise.reject("Immediate reject"),
    ]);
    console.log("Promise.all 2: ", resultWithRejection); // Never reached, rejection causes interruption
  } catch (error) {
    console.error("Error:", error);
  }

  setPromises();
  try {
    const resultWithCaughtRejection = await Promise.all([
      immediateResolve,
      nonPromise,
      timeoutPromise,
      Promise.reject("Immediate reject").catch(() => {}),
    ]);
    console.log("Promise.all 3: ", resultWithCaughtRejection); // Expected: [ 3, 42, 'Resolved after timeout', undefined ]. Rejection is never bubbled up
  } catch (error) {
    console.error("Error:", error);
  }
}

async function tryPromiseAllSettled() {
  setPromises();
  const result = await Promise.allSettled([
    immediateResolve,
    nonPromise,
    timeoutPromise,
  ]);
  console.log("Promise.allSettled 1: ", result);
  // Expected output: [{ status: 'fulfilled', value: 3 }, { status: 'fulfilled', value: 42 }, { status: 'fulfilled', value: 'Resolved after timeout' }]

  setPromises();

  try {
    const resultWithRejection = await Promise.allSettled([
      immediateResolve,
      nonPromise,
      timeoutPromise,
      Promise.reject("Immediate reject"),
    ]);
    console.log("Promise.allSettled 2: ", resultWithRejection);
    // Expected output: [{ status: 'fulfilled', value: 3 }, { status: 'fulfilled', value: 42 }, { status: 'fulfilled', value: 'Resolved after timeout' }, { status: 'rejected', reason: 'Immediate reject' }]
  } catch (error) {
    console.error("Error:", error);
  }
}

async function tryPromiseAny() {
  setPromises();
  const result = await Promise.any([
    immediateResolve,
    nonPromise,
    timeoutPromise,
  ]);
  console.log("Promise.any 1: ", result); // Expected output: 3, not 2, as it doesn't come from a promise

  setPromises();

  try {
    const resultWithRejection = await Promise.any([
      immediateResolve,
      nonPromise,
      timeoutPromise,
      Promise.reject("Immediate reject"),
    ]);
    console.log("Promise.any 2: ", resultWithRejection); // Always reached unless they all rejected
  } catch (error) {
    console.error("Error:", error);
  }
}

async function tryPromiseRace() {
  setPromises();
  const result = await Promise.any([
    immediateResolve,
    nonPromise,
    timeoutPromise,
  ]);
  console.log("Promise.race 1: ", result); // Expected output: 3

  setPromises();

  try {
    const resultWithRejection = await Promise.any([
      immediateResolve,
      nonPromise,
      timeoutPromise,
      Promise.reject("Immediate reject"),
    ]);
    console.log("Promise.race 2: ", resultWithRejection); // Never reached
  } catch (error) {
    console.error("Error:", error);
  }
}

export default async function main(): Promise<void> {
  console.log("Starting test:\n");
  console.time("Promise.all");
  await tryPromiseAll();
  console.timeEnd("Promise.all");
  console.log("");

  console.time("Promise.allSettled");
  await tryPromiseAllSettled();
  console.timeEnd("Promise.allSettled");
  console.log("");

  console.time("Promise.any");
  await tryPromiseAny();
  console.timeEnd("Promise.any");
  console.log("");

  console.time("Promise.race");
  await tryPromiseRace();
  console.timeEnd("Promise.race");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
