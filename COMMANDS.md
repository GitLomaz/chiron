# Development commands

Run commands from the repository root unless noted otherwise. See [README.md](README.md) for prerequisites and configuration.

```sh
npm install                 # install workspace dependencies
npm run dev                 # run API, teacher app, and student app
npm run build               # generate Prisma client and build all workspaces
npm run db:generate         # regenerate Prisma client after schema changes
npm run db:migrate          # apply/create development migrations (changes the database)
npm run start:api           # start the built API
```

The API tests import compiled files from `apps/api/dist`. Build the API before running them:

```sh
npm run build --workspace=@trivia/api
node --test apps/api/test
```

Individual tests can also be run with `node --test apps/api/test/<name>.test.cjs`. Tests primarily use mocks; they do not replace testing against PostgreSQL or in a browser.

The suite contains older fixtures and expectations that do not match current service signatures and authentication; expect failures until those tests are updated. On environments that prohibit child-process creation, Node's test runner may fail with `spawn EPERM` before running tests.

For production migrations use `npm run prisma:deploy --workspace=@trivia/api` against the intended database. `npm run db:seed --workspace=@trivia/api` writes seed data; inspect the seed before running it. See [scripts/README.md](scripts/README.md) for student simulation and [deploy/README.md](deploy/README.md) for deployment.
