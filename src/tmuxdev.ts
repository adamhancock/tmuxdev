#!/usr/bin/env node

import { $, chalk } from 'zx'
import inquirer from 'inquirer'

$.verbose = false

async function getFolderName(): Promise<string> {
  const pwd = await $`pwd`
  const path = pwd.stdout.trim()
  return path.split('/').pop() || 'tmuxdev'
}

async function getSessionName(): Promise<string> {
  const folderName = await getFolderName()
  return folderName
}

async function sessionExists(sessionName: string): Promise<boolean> {
  try {
    await $`tmux has-session -t ${sessionName}`
    return true
  } catch {
    return false
  }
}

async function getAllSessions(): Promise<string[]> {
  try {
    const sessions = await $`tmux list-sessions -F "#{session_name}"`
    return sessions.stdout.trim().split('\n').filter(s => s)
  } catch {
    return []
  }
}

async function createSession(sessionName: string): Promise<void> {
  console.log(chalk.green(`Creating new tmux session '${sessionName}' and starting pnpm dev...`))
  await $`tmux new-session -d -s ${sessionName} 'pnpm dev'`
  console.log(chalk.blue(`Development server started in tmux session '${sessionName}'`))
}

async function attachSession(sessionName: string): Promise<void> {
  console.log(chalk.green(`Attaching to tmux session '${sessionName}'...`))
  // Use execSync with inherited stdio to properly attach to tmux
  const { execSync } = await import('child_process')
  try {
    execSync(`tmux attach-session -t ${sessionName}`, { stdio: 'inherit' })
  } catch (error) {
    // tmux attach exits with code 0 on detach, so we can ignore errors
  }
}

async function killSession(sessionName: string): Promise<void> {
  await $`tmux kill-session -t ${sessionName}`
  console.log(chalk.red(`Killed session '${sessionName}'`))
}

type ActionChoice = 'attach-current' | 'create-current' | 'select-existing' | 'kill-session' | 'exit'

interface Choice {
  name: string
  value: ActionChoice
}

async function main(): Promise<void> {
  const sessionName = await getSessionName()
  const exists = await sessionExists(sessionName)
  const allSessions = await getAllSessions()
  
  const choices: Choice[] = []
  
  if (exists) {
    choices.push({ name: `Attach to current branch session (${sessionName})`, value: 'attach-current' })
  } else {
    choices.push({ name: `Create new session for current branch (${sessionName})`, value: 'create-current' })
  }
  
  if (allSessions.length > 0) {
    choices.push({ name: 'Select from existing sessions', value: 'select-existing' })
    choices.push({ name: 'Kill a session', value: 'kill-session' })
  }
  
  choices.push({ name: 'Exit', value: 'exit' })
  
  let action: ActionChoice
  try {
    const answer = await inquirer.prompt<{ action: ActionChoice }>([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices
      }
    ])
    action = answer.action
  } catch (error) {
    console.log(chalk.yellow('\nExiting...'))
    process.exit(0)
  }
  
  switch (action) {
    case 'attach-current':
      await attachSession(sessionName)
      break
      
    case 'create-current':
      await createSession(sessionName)
      const { attachNow } = await inquirer.prompt<{ attachNow: boolean }>([
        {
          type: 'confirm',
          name: 'attachNow',
          message: 'Would you like to attach to the session now?',
          default: true
        }
      ])
      if (attachNow) {
        await attachSession(sessionName)
      } else {
        console.log(chalk.yellow(`To attach later, run: tmux attach-session -t '${sessionName}'`))
        console.log(chalk.yellow(`To detach from the session, press: Ctrl+B then D`))
      }
      break
      
    case 'select-existing':
      const { selectedSession } = await inquirer.prompt<{ selectedSession: string }>([
        {
          type: 'list',
          name: 'selectedSession',
          message: 'Select a session to attach to:',
          choices: allSessions.map(s => ({ name: s, value: s }))
        }
      ])
      await attachSession(selectedSession)
      break
      
    case 'kill-session':
      const { sessionToKill } = await inquirer.prompt<{ sessionToKill: string }>([
        {
          type: 'list',
          name: 'sessionToKill',
          message: 'Select a session to kill:',
          choices: allSessions.map(s => ({ name: s, value: s }))
        }
      ])
      const { confirmKill } = await inquirer.prompt<{ confirmKill: boolean }>([
        {
          type: 'confirm',
          name: 'confirmKill',
          message: `Are you sure you want to kill session '${sessionToKill}'?`,
          default: false
        }
      ])
      if (confirmKill) {
        await killSession(sessionToKill)
      }
      break
      
    case 'exit':
      console.log(chalk.blue('Goodbye!'))
      break
  }
}

main().catch(console.error)