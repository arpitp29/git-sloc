# Git Line Tracker Extension for Visual Studio Code

The Git Line Tracker extension for Visual Studio Code helps you search for Git repositories within a specified root directory and then retrieve the lines added and deleted by a specific Git user for files with defined extensions. This extension provides an intuitive user interface in the VS Code settings to configure the root directory, Git user, and file extensions.

## Features

- **Search for Git Repositories**: Easily locate Git repositories within the specified root directory.

- **Track Line Changes**: Retrieve and track the lines added and deleted by a specific Git user for files with predefined extensions.

- **User-Friendly Settings**: Configure extension settings directly from the Visual Studio Code settings UI.

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking the Extensions icon in the Activity Bar on the side of the window.
3. Search for "Git Line Tracker" and install the extension.

## Usage

1. Open Visual Studio Code.
2. Go to the settings UI by clicking File > Preferences > Settings.
3. In the settings UI, find the "Git Line Tracker" section.
4. Configure the following settings:
   - **Root Directory**: Specify the root directory(comma separated for multiple) where the extension should search for Git repositories.
   - **Git User**: Enter the Git username whose line changes you want to track.
   - **File Extensions**: Define the file extensions (e.g., .js, .ts, .css) for which you want to track line changes.
   - **periodInDays**: Specify last n days period(Ex. 30).
   - **branches**:  Comma separated branches to look for calculating the sloc.
5. Save your settings.
6. Use the extension to search for Git repositories, track line changes, and gain insights into your codebase's history.

## Contributing

Contributions are welcome! Feel free to submit bug reports, feature requests, or pull requests to help improve this extension.

## License

