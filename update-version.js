// const cmString='git pull https://username:password@mygithost.com/my/repository'
// 'ls', [ '-lh', '/usr' ]


function npmVersionPatch() {
  console.log(' - Running npmVersionPatch...');
  const cmString = 'npm';
  const params = ['--no-git-tag-version','version', "patch"];
  const {spawnSync} = require('child_process');
  const cm = spawnSync(cmString, params);

  if (cm.status > 0) {
    console.error('npmVersionPatch ERROR:\n' + cm.stderr.toString());
    return null;
  }
  else {
    const msg = cm.stdout.toString();
    // console.log('VersionFromPkg:', msg);
    return msg;
  }
}

function getVersionFromPkg() {
  console.log(' - Running getVersionFromPkg...');
  const cmString = 'node';
  const params = ['-p', "require('./package.json').version"];
  const {spawnSync} = require('child_process');
  const cm = spawnSync(cmString, params);

  if (cm.status > 0) {
    console.error('getVersionFromPkg ERROR:\n' + cm.stderr.toString());
    return null;
  }
  else {
    const msg = cm.stdout.toString().trim();
    // console.log('VersionFromPkg:', msg);
    return msg;
  }
}

function gitPush(version) {
  console.log(' - Running git push...');
  const cmString = 'git';
  const params = ['push'];
  const {spawnSync} = require('child_process'),
    cm = spawnSync(cmString, params);
  if (cm.stderr) console.error(cm.stderr.toString());
  if (cm.stdout) console.log(cm.stdout.toString());
// console.log(`stderr: ${cm.stderr.toString()}`);
// console.log(`stdout: ${cm.stdout.toString()}`);
  console.log(' - Git push finished');
  // sentryUpdate(version);
}

function gitPull() {
  console.log(' - Running git pull...');
  const cmString = 'git';
  const params = ['pull'];
  const {spawnSync} = require('child_process'),
    cm = spawnSync(cmString, params);
  // console.log('STATUS: ' + cm.status);
  if (cm.status !== 0) {
    console.log(' - git pull ERROR:\n' + cm.stderr.toString());
    return false;
  }
  else {
    if (cm.stdout) {
      console.log('git pull OUTPUT:\n' + cm.stdout.toString());
      const msg = cm.stdout.toString();
      if (msg.indexOf('fatal:') < 0) {
        console.log(' - Git pull OK');
        return true;
      }
      else {
        console.log(' - Git pull FAILED');
        return false;
      }
    }
  }
}

function gitCommit(version) {
  const commitMessage = '"Version:' + version + '"';
  console.log(' - Running git commit . -m ' + commitMessage);
  const cmString = 'git';
  const params = ['commit', '.', '-m', commitMessage];
  const {spawnSync} = require('child_process'),
    cm = spawnSync(cmString, params);
  if (cm.stderr) console.error(cm.stderr.toString());
  if (cm.stdout) console.log(cm.stdout.toString());
// console.log(`stderr: ${cm.stderr.toString()}`);
// console.log(`stdout: ${cm.stdout.toString()}`);
  console.log(' - Git commit finished');
  gitTag(version);
}

function gitTag(version) {

  console.log(' - Running git tag +v'+ version + '-am' + version);
  const cmString = 'git';
  const params = ['tag', 'v'+ version, '-am', version];
  const {spawnSync} = require('child_process'),
      cm = spawnSync(cmString, params);
  if (cm.stderr) console.error(cm.stderr.toString());
  if (cm.stdout) console.log(cm.stdout.toString());
// console.log(`stderr: ${cm.stderr.toString()}`);
// console.log(`stdout: ${cm.stdout.toString()}`);
  console.log(' - Git tag finished');
  // gitPush(version);
}

function gitStatus() {
  console.log(' - Running git status...');
  const cmString = 'git';
  const params = ['status'];
  const {spawnSync} = require('child_process'),
    cm = spawnSync(cmString, params);
  // console.log('  STATUS: ' + cm.status);
  if (cm.status > 0) {
    console.error('git status ERROR:\n' + cm.stderr.toString());
    return false;
  }
  else {
    const msg = cm.stdout.toString();
    console.log(msg);
    if (msg.indexOf('nothing to commit, working tree clean') < 0
      || msg.indexOf('Your branch is ahead') >= 0) {
      console.log(' - Git status not clean or Your branch is ahead');
      return false;
    }
    else {
      console.log(' - Git status OK');
      return true;
    }
  }
}

if (!gitStatus()) process.exit(100);
// if (!gitPull()) process.exit(110);
if (!npmVersionPatch()) process.exit(120);
let version = getVersionFromPkg();
if (version !== null) {
  console.log('VersionFromPkg is:', version);
}


console.log(' - Running Version incrementation');
const fs = require('fs');
const xml2js = require('xml2js');

// Read config.xml
fs.readFile('config.xml', 'utf8', (err, data) => {
  if (err) {
    console.log(err);
    return process.exit(13);
  }
  xml2js.parseString(data, function (err, result) {
    if (err) {
      console.log(err);
      return process.exit(14);
    }
    const obj = result;
    console.log('previous version from config', obj['widget']['$']['version']);
    obj['widget']['$']['version'] = version;

    // Build XML from JS Obj
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(obj);
    // Write config.xml
    fs.writeFile('config.xml', xml, function (err) {
      if (err) {
        console.log(err);
        return process.exit(15);
      }
      console.log('Version incremented in config.xml to %s', version);

      fs.writeFile('./src/app/ver.json', JSON.stringify({"version": version}, null, 2), function (err) {
        if (err) {
          console.log(err);
          return process.exit(16);
        }
        console.log('Version incremented in ver.json to %s', version);

        console.log(' - Version incrementation finished');
        gitCommit(version);
      });
    });


  });
});


