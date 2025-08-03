# @adamhancock/tmuxdev

A CLI tool to manage tmux sessions for development servers, making it easy for tools like Claude to access console logs.

## Installation

```bash
npm install -g @adamhancock/tmuxdev
# or
pnpm add -g @adamhancock/tmuxdev
```

## Usage

```bash
tmuxdev
```

The CLI will:
- Use your current folder name as the session name
- Provide an interactive menu to:
  - Create or attach to a session for your current project
  - Select from existing tmux sessions
  - Kill running sessions
- Automatically run `pnpm dev` when creating new sessions
- Handle graceful exits (Ctrl+C)

## Features

- **Automatic session naming**: Uses the current folder name for easy identification
- **Interactive menu**: Simple navigation with arrow keys
- **Session management**: Create, attach, list, and kill tmux sessions
- **Development server integration**: Automatically starts `pnpm dev` in new sessions
- **Graceful exit handling**: Properly handles Ctrl+C interruptions

## Requirements

- Node.js
- tmux installed on your system
- A project with `pnpm dev` script (or modify the source to use your preferred command)

## License

MIT