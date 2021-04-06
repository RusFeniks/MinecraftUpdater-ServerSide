const crypto = require('crypto');
const fs = require('fs');

let settings = JSON.parse(fs.readFileSync("syncOptions.json"));


function makePath(_localPath) {
    let slashRegExp = new RegExp("[\\/]");
    let dotRegExp = new RegExp("^[.]*$");
    let pathChunks = (settings.root + _localPath).split(slashRegExp);

    let resultPath = ".";
    pathChunks.forEach(chunk => {
        if (!dotRegExp.test(chunk)) {
            resultPath += `/${chunk}`
        }
    });
    return resultPath;
}

function getFileHash(_path) {
    if (fs.statSync(_path).isDirectory()) { return ""; }
    let hash = crypto.createHash('sha256');
    let file = fs.readFileSync(_path);
    return hash.update(file).digest("hex");
}

function getFilesList(_path) {
    let filesList = [ _path ];
    if (!fs.existsSync(_path)) { return []; }
    if (!fs.statSync(_path).isDirectory()) { return filesList; }
    fs.readdirSync(_path).forEach(file => {
        let fullPath = _path + `/${file}`;
        if(fs.statSync(fullPath).isDirectory()) {
            filesList = filesList.concat(getFilesList(fullPath));
        } else { filesList.push(fullPath); }
    });
    return filesList;
}



let serverFileHashList = [];
settings.syncElements.forEach(element => {
    let path = makePath(element);
    getFilesList(path).forEach(_file => {
        !serverFileHashList.find(e => { return e.file == _file }) ?
            serverFileHashList.push({
                file: _file.replace(new RegExp(`^${settings.root}`), ""),
                hash: getFileHash(_file)
            }) : null;
    });
})

console.log(serverFileHashList);
fs.writeFileSync(makePath(".hash"), JSON.stringify(serverFileHashList));
fs.writeFileSync(makePath(".syncOptions"), JSON.stringify(settings));