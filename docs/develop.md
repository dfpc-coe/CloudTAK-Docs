# Developing CloudTAK

CloudTAK can be developed locally without Docker, and that is usually the easiest way to iterate on code changes.

> [!WARNING]
> This workflow is intended for local development only.
> It starts the CloudTAK API and the web development server, but it does **not** set up the separate tiles server or events server.
> If you need functionality backed by those services, you must run and configure them separately.

These steps assume Ubuntu 24.04. If you are on macOS, the same flow works with Homebrew-managed packages. If you are on Windows, the simplest route is to use WSL2 with Ubuntu and follow the same commands there.

## What you need

Before you start, make sure you have:

- `git`
- Node.js `24.x`
- `npm`
- PostgreSQL
- PostGIS

CloudTAK's local API server expects a PostgreSQL database and uses PostGIS-backed tables in its migrations, so a basic PostgreSQL install should include the PostGIS extension as well.

## 1. Install system dependencies on Ubuntu 24.04

If you already have Node.js `24.x`, PostgreSQL, and PostGIS installed, you can skip this section.

```sh
sudo apt update
sudo apt install -y git build-essential curl \
	 postgresql postgresql-client postgresql-contrib \
	 postgis postgresql-16-postgis-3
```

For Node.js, using `nvm` tends to be the least painful option during development:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 24
nvm use 24
node --version
npm --version
```

If you are on macOS, install PostgreSQL/PostGIS with Homebrew and use either Homebrew or `nvm` for Node.js. On Windows, WSL2 is strongly preferred over a native setup if you want the least amount of friction.

## 2. Start PostgreSQL

Make sure the PostgreSQL service is running before you try to start CloudTAK.

```sh
sudo systemctl enable --now postgresql
sudo systemctl status postgresql
```

If `status` shows the service is active, you are ready to create a development database.

## 3. Create a basic local database

For local development, a dedicated database user is usually easier than relying on the default `postgres` account.

The following example creates:

- a role named `cloudtak`
- a database named `tak_ps_etl`
- the required `postgis` extension

```sh
sudo -u postgres psql <<'SQL'
DO $$
BEGIN
	IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cloudtak') THEN
		CREATE ROLE cloudtak LOGIN PASSWORD 'cloudtak';
	END IF;
END
$$;

ALTER ROLE cloudtak CREATEDB;

SELECT 'CREATE DATABASE tak_ps_etl OWNER cloudtak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tak_ps_etl')\gexec

\c tak_ps_etl
CREATE EXTENSION IF NOT EXISTS postgis;
SQL
```

At this point you should have a working local database that CloudTAK can connect to.

## 4. Install the project dependencies

For a basic local server setup, you only need the API package and the web package under it.

```sh
cd /path/to/CloudTAK/api
npm install

cd web
npm install

cd ..
```

For day-to-day development, use the web development server instead of building the frontend bundle.

## 5. Create a local API config file

The local API process reads its `.env` file from the `api/` directory, and in this project that file is JSON rather than shell-style `KEY=value` format.

Create `api/.env` with content like this:

```json
{
  "POSTGRES": "postgres://cloudtak:cloudtak@localhost:5432/tak_ps_etl",
  "SigningSecret": "cloudtak-local-dev",
  "API_URL": "http://localhost:5001",
  "PMTILES_URL": "http://localhost:5001"
}
```

You can keep this file minimal for local development. If `StackName` is not set, CloudTAK will treat the run as a local test-style environment.

## 6. Start the CloudTAK development servers

Run the API server and the web development server in separate terminals.

In the first terminal, start the API from the `api/` directory:

```sh
cd /path/to/CloudTAK/api
npm run dev
```

In the second terminal, start the web dev server from the `api/web/` directory:

```sh
cd /path/to/CloudTAK/api/web
npm run serve
```

On first startup, the API will connect to PostgreSQL, apply its migrations, and populate a small amount of default data if the database is empty.

When both processes are running successfully:

- the API is available at `http://localhost:5001`
- the web UI is available at `http://localhost:8080`

Open `http://localhost:8080` in your browser for normal frontend development. The web dev server proxies `/api` requests to the local API on port `5001`.

## 7. A quick sanity check

If you want to verify the database is reachable before starting the app, this is usually enough:

```sh
psql "postgres://cloudtak:cloudtak@localhost:5432/tak_ps_etl" -c 'SELECT PostGIS_Version();'
```

If that returns a version string, the database side is ready.

## 8. Common issues

### PostgreSQL connection errors

If CloudTAK cannot connect to PostgreSQL:

- confirm PostgreSQL is running
- confirm the username, password, database name, and port in `api/.env`
- make sure the database actually exists

### PostGIS extension errors

If startup fails with a PostGIS-related migration error, run this once and try again:

```sh
sudo -u postgres psql -d tak_ps_etl -c 'CREATE EXTENSION IF NOT EXISTS postgis;'
```

### The frontend looks out of date

If you changed frontend code and the UI does not reflect it yet, make sure the web dev server is running:

```sh
cd /path/to/CloudTAK/api/web
npm run serve
```

Then refresh the browser. If needed, restart the web dev server.

## 9. Optional: quickest local stack with Docker Compose

If you mainly want to get the project running and do not need a manual PostgreSQL install, the repository also includes Docker Compose support. That is still a good option for a disposable local environment, but for day-to-day development the direct `api/` workflow above is usually easier to understand and debug.
