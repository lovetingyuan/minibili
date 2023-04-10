import inquirer from 'inquirer'
import { createRequire } from 'module';
import fs from 'node:fs'

const require = createRequire(import.meta.url);

const { version } = require('../package.json')
const appJsonFile = require.resolve('../app.json')

inquirer
  .prompt([
    {
      type: 'input',
      name: 'version',
      message: `请输入更新后的version(当前版本:${version})`,
    },
    {
      type: 'input',
      name: 'changelog',
      message: '请输入changelog',
    },
  ])
  .then(answers => {
    const appJson = require(appJsonFile)
    appJson.version = answers.version
    appJson.ios.buildNumber = appJson.version
    appJson.android.versionCode++
    fs.writeFileSync(appJsonFile, JSON.stringify(appJsonFile, null, 2))
    // console.log(
    //   `Your name is ${answers.version}, you are from ${answers.changelog} and  old.`,
    // )
  })
