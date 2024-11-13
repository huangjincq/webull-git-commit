import * as vscode from 'vscode'
import * as cp from 'child_process'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // 获取当前分支名

  const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports

  if (!gitExtension.enabled) {
    vscode.window.showErrorMessage('没有安装Git插件, 生成commit message 不可用')
    return false
  }

  let gitAPI = gitExtension.getAPI(1)

  let repo = gitAPI.repositories[0] //当前git 仓库

  let disposable = vscode.commands.registerCommand('webull-git-commit.createCommitFromBranch', async () => {
    // 获取用户配置的正则
    const config = vscode.workspace.getConfiguration('commit-helper')

    if (!config.regex) {
      vscode.window.showErrorMessage('没有请先设置匹配规则')
      return false
    }
    const regex = new RegExp(config.regex)
    const branchName = ((repo.state.HEAD && repo.state.HEAD.name) || '').trim()

    const jiraId = branchName.match(regex)

    if (!jiraId) {
      vscode.window.showErrorMessage('Jira 单号获取失败, 无法生成Commit Message')
      return false
    }

    const commitMessage = `feat[${jiraId}]:`
    repo.inputBox.value = commitMessage
  })

  context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
