import spawn from 'cross-spawn';

function runGitCommand(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const gitProcess = spawn('git', args);

    // Listen to the output stream (stdout)
    gitProcess.stdout?.on('data', (data) => {
      console.log(`runGitCommand Output: ${data}`);
    });

    // Listen to the error stream (stderr)
    gitProcess.stderr?.on('data', (data) => {
      console.error(`runGitCommand Error: ${data}`);
    });

    // Handle process exit
    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code: ${code}`));
      }
    });
  });
}

export async function gitClone(url: string, targetPath: string) {
  try {
    await runGitCommand(['clone', url, targetPath])
  } catch (err) {
    console.error('Failed to run git clone:', err);
  }
}