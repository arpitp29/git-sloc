// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { time } from 'console';


function isStringNumeric(input: string): boolean {
	// Function to return true if the input is a decimal number
	return /^\d+$/.test(input);
}

function formatDate(date: Date): string {
	// Function to format the date in Mon day year format
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // Months are zero-indexed, so add 1
	const day = date.getDate();
  
	// Format the month and day with leading zeros if needed
	const formattedMonth = month.toString().padStart(2, '0');
	const formattedDay = day.toString().padStart(2, '0');
  
	// Create the formatted date string
	const formattedDate = `${getMonthName(month)} ${formattedDay} ${year}`;
  
	return formattedDate;
  }
  
  function getMonthName(month: number): string {
	const months = [
	  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];
	return months[month - 1]; // Months are zero-indexed, so subtract 1
  }

function getLinesAddedAndDeletedByUser(repositoryPath: string, username: string, since: string, until: string, branches: string ) {
  return new Promise<{ [key: string]: [number,number] }>((resolve, reject) => {
	// Function returns the number of lines added or deleted by a user for a repository
	const cmds: string[] = [];
	for(const branch of branches.split(",")){
		const cmd_single = `git log --author="${username}" --pretty=tformat: --numstat "${branch}" --since="${since}"  --until="${until}"`
		cmds.push(cmd_single)
	}
	//Push the current branch 
	const cmd_single = `git log --author="${username}" --pretty=tformat: --numstat --since="${since}"  --until="${until}"`
	cmds.push(cmd_single)

    const cmd = cmds.join(" || ") 
	//`git log --author="${username}" --pretty=tformat: --numstat main --since="${since}"  --until="${until}" || git log --author="${username}" --pretty=tformat: --numstat master --since="${since}" --until="${until}" || git log --author="${username}" --pretty=tformat: --numstat --since="${since}" --until="${until}"`;

    exec(cmd, { cwd: repositoryPath }, (error, stdout, stderr) => {
	  const exectentionWiseAddedDeletedCountMap: { [key: string]: [number,number]} = {};
      if (error) {
        reject(error);
        return exectentionWiseAddedDeletedCountMap;
      }
      const lines = stdout.split('\n');	  

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length == 3) {
			const fileExtension = path.extname(parts[2]);
			if (!(fileExtension in exectentionWiseAddedDeletedCountMap)){
				exectentionWiseAddedDeletedCountMap[fileExtension] = [0,0]
			}

			if (isStringNumeric(parts[0])){
				exectentionWiseAddedDeletedCountMap[fileExtension][0] += parseInt(parts[0]);
			}

			if (isStringNumeric(parts[1])){
				exectentionWiseAddedDeletedCountMap[fileExtension][1] += parseInt(parts[1]);
			}
        }
      }
      resolve(exectentionWiseAddedDeletedCountMap);
    });
  });
}

function isGitRepository(dirPath: string): boolean {
  const gitDir = path.join(dirPath, '.git');
  // Returns true if the directory is git repository
  try {
    // Check if a directory named '.git' exists within the specified directory
    const stat = fs.statSync(gitDir);
    return stat.isDirectory();
  } catch (error) {
    // If the directory does not exist or there's an error, it's not a Git repository
    return false;
  }
}

function findGitRepositories(rootDir: string): string[] {
  const gitRepositories: string[] = [];

  function exploreDirectory(dirPath: string) {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const isDirectory = (fs.statSync(fullPath)).isDirectory();

      if (isDirectory) {
        if (isGitRepository(fullPath)) {
          gitRepositories.push(fullPath);
        } else {
          exploreDirectory(fullPath); // Recursively explore subdirectories
        }
      }
    }
  }

  if(isGitRepository(rootDir)){ // If root directory itself is the git repository
	gitRepositories.push(rootDir)
  }else{
	  exploreDirectory(rootDir);
  }
  return gitRepositories;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
  }
  

async function getSLOC(): Promise<[string,{[key: string]: [number,number] }]> {
	//vscode.window.showInformationMessage(`Computing SLOC.`);
	
	const CONFIG_SECTION = 'gitSloc';
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	
	// Retrieve individual configuration variables
	const rootDirectories = config.get<string>('rootDirectory') || 'rootDir';
	const userName = config.get<string>('userName') || 'userName';
	const fileExtensions = config.get<string>('fileExtensions') || 'fileExtensions';
	const branches = config.get<string>('branches') || "main,master";
	const periodInDays = config.get<number>('periodInDays') || 30;
	
	const totalExtensionWiseAddedDeleted: { [key: string]: [number,number] } = {};

	const currentDate = new Date();
	const fromDate = new Date(currentDate);
	fromDate.setDate(currentDate.getDate() - periodInDays);
	const startOfMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
	const formattedStartOfMonthDate = formatDate(startOfMonthDate);
	const formattedCurrentDate = formatDate(currentDate);

	const rootDirectoriesList = rootDirectories.split(",")

	for(const rootDirectory of rootDirectoriesList){

	console.log(`Searching Git repositories at ${rootDirectory}`);

	if (fs.existsSync(rootDirectory)) {
		const repositories = findGitRepositories(rootDirectory);
			console.log('Git repositories found:');
			const promises : Promise<{[key: string]: [number,number]}>[] = []
			repositories.forEach((repoPath) => {
				console.log('Repository: '+ repoPath);
				promises.push(getLinesAddedAndDeletedByUser(repoPath, userName, formattedStartOfMonthDate, formattedCurrentDate, branches))
			});

			const extensionWiseAddedDeletedList = await Promise.all(promises);

						// Now, you can proceed with the results
			extensionWiseAddedDeletedList.forEach((extensionWiseAddedDeleted) => {
				for (const ext in extensionWiseAddedDeleted){
					if(!(ext in totalExtensionWiseAddedDeleted)){
						totalExtensionWiseAddedDeleted[ext]=[0,0]
					}
					totalExtensionWiseAddedDeleted[ext][0]+= extensionWiseAddedDeleted[ext][0]
					totalExtensionWiseAddedDeleted[ext][1]+= extensionWiseAddedDeleted[ext][1]
				}
			})
		}
	else{
		vscode.window.showInformationMessage(`Dir:error [Failed to read from ${rootDirectory}].`);
	}
	}

		//await sleep(timeout);
		let totaladded = 0
		let totaldeleted = 0
		for(const suffix of fileExtensions.split(",")){
			if (suffix in totalExtensionWiseAddedDeleted){
				totaladded+=totalExtensionWiseAddedDeleted[suffix][0]
				totaldeleted+=totalExtensionWiseAddedDeleted[suffix][1]
			}
		}
		
		console.log(JSON.stringify(totalExtensionWiseAddedDeleted))

		console.log(`#Total Lines added by ${userName}: ${totaladded}`);
		console.log(`#Total Lines deleted by ${userName}: ${totaldeleted}`);

		vscode.window.showInformationMessage(`SLOC Computed sucessfully.`);
		return [`SLOC: +${totaladded} -${totaldeleted}`,totalExtensionWiseAddedDeleted]
}



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "git-sloc" is now active!');
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('git-sloc.activate', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		statusBarItem.text = (await getSLOC())[0];
		vscode.window.showInformationMessage('GIT-SLOC Updated!!');		
	});

	const updateInterval = 30*60*1000; // 30mins

	const sloc_text = (await getSLOC())[0];
	statusBarItem.text = sloc_text

	statusBarItem.show();
	// Update the time every 10 minute
	setInterval(async () => {
		statusBarItem.text = (await getSLOC())[0];
	}, updateInterval);

	// this code is for showing the sloc in webview
	const disposable1 = vscode.commands.registerCommand('git-sloc.showFullSloc', async () => {
        const panel = vscode.window.createWebviewPanel(
            'jsonViewer',
            'JSON Viewer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );

		const sloc_text = (await getSLOC())[1];
		
        // Format the JSON and set it as the Webview's HTML content
        const formattedJson = JSON.stringify(sloc_text, null, 2);
        panel.webview.html = `
            <html>
            <body>
                <pre>${formattedJson}</pre>
            </body>
            </html>
        `;
    });


	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable1);
	context.subscriptions.push(statusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() {}
