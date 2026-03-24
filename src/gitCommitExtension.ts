import * as vscode from 'vscode'

const gitCommitExtensions = (context: vscode.ExtensionContext) => {
  // 获取当前分支名
  const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports

  if (!gitExtension.enabled) {
    vscode.window.showErrorMessage('没有安装Git插件, 生成commit message 不可用')
    return false
  }

  // 根据分支名称 生成 commit 消息
  const createCommitFromBranch = vscode.commands.registerCommand(
    'webull-git-commit.createCommitFromBranch',
    (uri: vscode.Uri) => {
      const repo = getGitRepo(gitExtension)

      if (repo) {
        const jiraId = getJiraId(repo)
        if (jiraId) {
          const commitMessage = `feat[${jiraId}]:`
          repo.inputBox.value = commitMessage
        } else {
          vscode.window.showErrorMessage('Jira 单号获取失败, 无法生成Commit Message')
        }
      }
    }
  )
  context.subscriptions.push(createCommitFromBranch)

  const openBrowserByBranch = vscode.commands.registerCommand('webull-git-commit.openBrowserByBranch', () => {
    const repo = getGitRepo(gitExtension)
    if (repo) {
      const jiraId = getJiraId(repo)
      if (jiraId) {
        vscode.env.openExternal(
          vscode.Uri.parse(`https://teamup.webullbroker.com/develop-management/demand/list?issueJiraKey=${jiraId}`)
        )
      } else {
        vscode.window.showErrorMessage('Jira 单号获取失败')
      }
    }
  })

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
  statusBarItem.text = `$(browser) Open Team Up`
  statusBarItem.command = 'webull-git-commit.openBrowserByBranch'
  statusBarItem.show()

  context.subscriptions.push(createCommitFromBranch)
  context.subscriptions.push(openBrowserByBranch)
  context.subscriptions.push(statusBarItem)
}

export default gitCommitExtensions

// 获取当前是哪个 Git 仓库
const getGitRepo = (gitExtension: any) => {
  let gitAPI = gitExtension.getAPI(1)
  const repos = gitAPI.repositories
  // 如果当前工作区域内只有一个git仓库，则直接返回
  if (repos.length === 0) {
    vscode.window.showWarningMessage('当前工作区域内为初始化Git仓库，该功能无法使用')
    return null
  }
  if (repos.length === 1) {
    return gitAPI.repositories[0]
  }
  // TODO Hack 如果工作区域内有多个git仓库，则通过当前激活的文档来判断是要提交哪个仓库
  // 获取当前活动的文档URI
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor) {
    vscode.window.showWarningMessage('当前工作区域内有多个Git仓库，并无激活文件，无法得知处于哪个仓库')
    return null
  }

  const repo = repos.find((repository: any) => {
    return activeEditor.document.uri.fsPath.startsWith(repository.rootUri.fsPath)
  })
  return repo
}

const getJiraId = (repo: any) => {
  const regex = /\/([^\/]+?-\d+)/

  const branchName = ((repo.state.HEAD && repo.state.HEAD.name) || '').trim()

  return branchName.match(regex)?.[1]
}
