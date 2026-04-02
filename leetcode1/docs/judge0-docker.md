# Judge0 (Docker) Setup for Local Development

If you can't (or don't want to) use RapidAPI, you can run **Judge0 CE locally** via Docker and point this backend to it.

## 1) Start Judge0 with Docker

From `leetcode1/`:

```bash
docker compose -f docker-compose.judge0.yml up -d
```

Judge0 API should be available on:

- `http://localhost:2358`

Quick check:

```bash
curl http://localhost:2358/languages
```

## Troubleshooting

- If you see `Judge0 is not running on http://localhost:2358`, it means nothing is listening on port `2358`.
- On Windows, if Docker commands fail with something like `docker_engine` / `npipe` errors, **Docker Desktop is not running**. Start Docker Desktop first, then retry `docker compose ... up -d`.
- If `localhost` gives issues, try setting `JUDGE0_URL=http://127.0.0.1:2358` in `leetcode1/.env`.
- If Judge0 returns `status_id: 13` (`Internal Error`) for every submission, it's usually a sandbox/worker permission issue. Use the provided `docker-compose.judge0.yml` (it enables `privileged` + `seccomp=unconfined`) and restart:
  - `docker compose -f docker-compose.judge0.yml down`
  - `docker compose -f docker-compose.judge0.yml up -d --force-recreate`
- If logs show `/box` missing (example: `No such file or directory @ rb_sysopen - /box/main.cpp` or `chown: cannot access '/box'`), ensure the compose file mounts a named volume to `/box` and then recreate with volumes:
  - `docker compose -f docker-compose.judge0.yml down -v`
  - `docker compose -f docker-compose.judge0.yml up -d --force-recreate`
- If you see cgroup errors like `Cannot write /sys/fs/cgroup/memory/box-*/tasks: No such file or directory`, your host is running **cgroup v2** (common on newer Linux + WSL/Docker Desktop). Judge0's `isolate` sandbox expects **cgroup v1** for memory limiting, so execution may not work reliably. Recommended options:
  - Run Judge0 on a Linux VM with good cgroup v1 support (e.g. Ubuntu 22.04/20.04) and point `JUDGE0_URL` to that VM.
  - Use Judge0 Cloud / RapidAPI instead of self-hosting locally.

## 2) Configure backend to use local Judge0

In `leetcode1/.env` set:

```env
JUDGE0_URL=http://localhost:2358
```

If your Judge0 build doesn’t support `/submissions/batch`, set:

```env
JUDGE0_DISABLE_BATCH=true
```

Optional (poll tuning):

```env
JUDGE0_POLL_INTERVAL_MS=1000
JUDGE0_POLL_MAX_MS=60000
DEBUG_JUDGE0=false
```

When `JUDGE0_URL` is set, `src/utils/ProblemUtility.js` will **stop using RapidAPI headers** and will call the Docker Judge0 instance directly.

## 3) Test `POST /problem/create` from Postman

1. Login as admin (so your cookie is set).
2. Call `POST http://localhost:<PORT>/problem/create`
3. Send JSON with:
   - `referenceSolution`: array of `{ language, completeCode }`
   - `hiddenTestCases`: array of `{ input, output }`

If Judge0 is down, you'll get: `Judge0 is not running on http://localhost:2358`.
