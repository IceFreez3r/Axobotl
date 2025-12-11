# Axobotl 🦎

An open-source implementation for the [HiddenGems](https://hiddengems.gymnasiumsteglitz.de) programming competition, written in TypeScript.

## Build

You can run the bot without a TypeScript compiler, as the repository includes precompiled JavaScript files in the [`dist/`](./dist/) directory. To get started, download the runner from the [main repository](https://github.com/specht/hidden-gems), and execute it with the path to this repository. Use [`start.sh`](start.sh) (or [`start.bat`](start.bat) on Windows) to handle the setup: `./runner.rb path/to/this/repo`.

If you prefer to compile the files yourself, ensure you have pnpm (>=10.7.1) installed. We recommend installing it via [corepack](https://pnpm.io/installation#using-corepack). Then, install the required dependencies:

```bash
pnpm install
```

and build the bot:

```bash
pnpm build # Use `pnpm dev` for watch mode
```

Once compiled, start the runner as described above.

## Contribute

We welcome contributions! When submitting a pull request, please include a clear explanation of why your changes are necessary.

If you plan to make significant changes to the bot's strategy, please [open an issue](https://github.com/IceFreez3r/Axobotl/issues/new) first to discuss your ideas with us.

Happy gem collecting! 💎
