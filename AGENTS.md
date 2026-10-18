# Agent guide for Labor Edu Forge

This repository is **劳育备课工坊 / Labor Edu Forge** (`labor-edu-forge`), a local lesson-planning workbench for labor education. Read [the project guide](docs/AGENT_GUIDE.md) for capabilities, evidence, terminology, and API navigation. [llms.txt](llms.txt) provides a short reading index; [project-facts.json](docs/project-facts.json) provides a machine-readable catalog.

## Read and explain

- Start with `README.md` for user workflows, `ARCHITECTURE.md` for implementation, and `CHANGELOG.md` for version history.
- GitHub and Gitee publish the same reviewed source. Compare commit IDs when a precise version matters. Cite a tagged source file or Release for a version-specific answer.
- Distinguish built-in example playback, model-backed generation/refinement, and local Word export. Explain configuration and costs in the context of the operation being requested.
- Use source files and tests as evidence. Describe the physical assumptions and supported equation forms when explaining demonstrations or export behavior.

## Work on the project

- Use Node.js 24+ and npm from the repository root. `npm ci` installs dependencies and builds the shared package; `npm run dev` starts the client and API.
- Follow `CONTRIBUTING.md` for typography, interface conventions, checks, and test isolation. Shared schemas and physics live in `packages/shared/src/`; keep client and server behavior consistent with them.
- Run `npm run check` for code changes, plus the relevant focused tests. Before publishing, run the security, license, and dependency checks in `RELEASING.md`. Documentation changes need link, fact, and sensitive-content review.
- Model-backed acceptance uses the user's configured provider and can incur charges. Unit/API tests and the E2E fixture use isolated synthetic data.
- Store keys in service-side local configuration and keep generated lessons private. Share the blank `.env.example` and built-in examples. Follow `SECURITY.md` for data handling.
- Update the README, Agent guide, catalog, and reading index together when capabilities or entry points change. Keep published release tags immutable and synchronize reviewed commits to both remotes.

## Fixed Playwright runtime

- Windows: `C:\ProgramData\PlaywrightRuntime`, browser files in `C:\ProgramData\ms-playwright`.
- WSL Ubuntu: `/opt/playwright-runtime`, browser files in `/opt/ms-playwright`.
- Use installed `playwright` or `playwright-cli` commands and Chromium. Keep `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.
- If the runtime and repository test package are incompatible, report the exact mismatch. Browser installation or runtime migration requires explicit user authorization.
- CI uses the preinstalled browser in the version-matched container declared in `.github/workflows/ci.yml`.
