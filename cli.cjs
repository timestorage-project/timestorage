#!/usr/bin/env node

const { exec } = require('child_process');
const { program } = require('commander');
const prompts = require('prompts');
const chalk = require('chalk');

program
  .name('timestorage-cli')
  .description('CLI tool for managing Time Storage admins and editors')
  .version('1.0.0');

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

program
  .command('add-admin')
  .description('Add a new admin to the system')
  .action(async () => {
    try {
      const response = await prompts({
        type: 'text',
        name: 'principalId',
        message: 'Enter the Principal ID of the new admin:',
        validate: value => value.length > 0 ? true : 'Principal ID cannot be empty'
      });

      if (!response.principalId) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      console.log(chalk.blue('Adding new admin...'));
      
      const command = `dfx canister call timestorage_backend addAdmin '(principal "${response.principalId}")' --network=ic`;
      const result = await executeCommand(command);
      
      if (result.includes('ok')) {
        console.log(chalk.green('✓ Admin added successfully'));
      } else {
        console.log(chalk.red('✗ Failed to add admin'), result);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

program
  .command('add-editor')
  .description('Add a new editor to the system')
  .action(async () => {
    try {
      const response = await prompts({
        type: 'text',
        name: 'principalId',
        message: 'Enter the Principal ID of the new editor:',
        validate: value => value.length > 0 ? true : 'Principal ID cannot be empty'
      });

      if (!response.principalId) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      console.log(chalk.blue('Adding new editor...'));
      
      const command = `dfx canister call timestorage_backend addEditor '(principal "${response.principalId}")' --network=ic`;
      const result = await executeCommand(command);
      
      if (result.includes('ok')) {
        console.log(chalk.green('✓ Editor added successfully'));
      } else {
        console.log(chalk.red('✗ Failed to add editor'), result);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

program.parse();
