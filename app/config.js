var fs = require('fs');
var path = require('path');

const loadConfig = () => {
    if (!fs.existsSync(path.join(__dirname, 'config.json'))) {
        fs.writeFileSync(path.join(__dirname, 'config.json'), '{}');
    }

    return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
};


const setConfig = (key, value) => {
    var config = loadConfig();
    config[key] = value;
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config));
}

const getConfig = (key) => {
    var config = loadConfig();
    return config[key];
}

const removeConfig = (key) => {
    var config = loadConfig();
    delete config[key];
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config));
}

module.exports = {
    setConfig,
    getConfig,
    removeConfig
};