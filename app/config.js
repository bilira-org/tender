var fs = require('fs');
var path = require('path');

const configPath = path.join(__dirname, 'config.json');

const loadConfig = () => {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, '{}');
    }

    return JSON.parse(fs.readFileSync(configPath));
};


const setConfig = (key, value) => {
    var config = loadConfig();
    config[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(config));
}

const getConfig = (key) => {
    var config = loadConfig();
    return config[key];
}

const removeConfig = (key) => {
    var config = loadConfig();
    delete config[key];
    fs.writeFileSync(configPath, JSON.stringify(config));
}

module.exports = {
    setConfig,
    getConfig,
    removeConfig
};