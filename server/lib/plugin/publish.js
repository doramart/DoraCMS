/*
 * @Author: doramart
 * @Date: 2019-09-26 15:52:06
 * @Discription: 处理插件发布逻辑
 * @Last Modified by: doramart
 * @Last Modified time: 2021-12-27 23:09:03
 */
'use strict';
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const rulePath = path.resolve(__dirname, './');

const designatedPlugin = ['egg-dora-uploadfile'];
let pluginArr = [];
fs.readdirSync(rulePath).forEach(function (name) {
  if (name !== 'publish.js' && name.indexOf('egg-dora') === 0) {
    pluginArr.push(name);
  }
});

if (designatedPlugin.length > 0) {
  pluginArr = designatedPlugin;
}
console.log('pluginArr', pluginArr);

// 设置本地存放插件目录
const basePluginForderPath = '/Users/dora/Documents/dora/coding.net/egg-cms-plugins';

function modifyFileByPath(targetPath, replaceStr, targetStr) {
  const readText = fs.readFileSync(targetPath, 'utf-8');
  let reg = new RegExp(replaceStr, 'g');
  if (replaceStr.indexOf('path.') >= 0) {
    reg = replaceStr;
  }
  const newRenderContent = readText.replace(reg, targetStr);
  fs.writeFileSync(targetPath, newRenderContent);
}

// 初始化新建git仓库
const initGitPro = () => {
  if (fs.existsSync(basePluginForderPath)) {
    shell.rm('-rf', `${basePluginForderPath}/*`);
    shell.cd(`${basePluginForderPath}`);
    for (const pluginItem of pluginArr) {
      const targetGitUrl = `https://github.com/doramart/${pluginItem}.git`;
      // TODO 必须本地已经添加ssh上传
      shell.exec(`git clone ${targetGitUrl}`);
    }
  }
};

// 合并代码并提交到git
const updateGithubCode = () => {
  if (fs.existsSync(basePluginForderPath)) {
    for (const pluginItem of pluginArr) {
      // 更新版本号
      let pluginNewVersion = '';
      const localPluginPackagePath = `${rulePath}/${pluginItem}/package.json`;
      if (fs.existsSync(localPluginPackagePath)) {
        const pkgInfo = require(localPluginPackagePath);
        const oldVersion = pkgInfo.version;
        console.log('plugin old version:', oldVersion);
        const versionArr = oldVersion.split('.');
        pluginNewVersion = `${versionArr[0]}.${versionArr[1]}.${Number(versionArr[2]) + 1}`;
        console.log('plugin new version:', pluginNewVersion);

        const versionStr = `"version": "${oldVersion}",`;
        const newVersionStr = `"version": "${pluginNewVersion}",`;
        modifyFileByPath(localPluginPackagePath, versionStr, newVersionStr);
      }

      const pluginProPath = `${basePluginForderPath}/${pluginItem}`;
      const pluginFile = [
        `${pluginProPath}/app`,
        `${pluginProPath}/config`,
        `${pluginProPath}/.travis.yml`,
        `${pluginProPath}/package.json`,
        `${pluginProPath}/README.md`,
      ];
      if (fs.existsSync(pluginProPath)) {
        shell.cd(`${pluginProPath}`);
        shell.exec('git pull');
        // 创建并切换分支
        shell.exec(`git checkout -b ${pluginNewVersion}`);
        shell.rm('-rf', pluginFile);
        shell.cp('-R', `${rulePath}/${pluginItem}/*`, `${pluginProPath}`);
        if (fs.existsSync(`${pluginProPath}/node_modules`)) {
          shell.rm('-rf', `${pluginProPath}/node_modules`);
        }

        // 上传到github
        shell.exec('git add *');
        shell.exec(`git commit -m 'update ${pluginItem}'`);
        shell.exec(`git push --set-upstream origin ${pluginNewVersion}`);

        // 发布到npm
        // shell.exec(`npm adduser`);
        shell.exec('npm publish');
      }
    }
  }
};

initGitPro();
updateGithubCode();
