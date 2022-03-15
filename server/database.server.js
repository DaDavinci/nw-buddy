const express = require('express');

var DataBase = {
    players: [],
};

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

class DataServer {

    app = {};
    port = 8421;

    constructor(port) {

        this.app = express();
        this.port = parseInt(port, 10) ||  8421;
        this.app.listen(this.port);

        console.log(`Server started on port ${this.getUrl()}`);

        this.app.get('/player/add', function (request, response) {

            const hasQuery = Object.keys(request.query).length > 0;
            const hasHeaders = Object.keys(request.headers).length > 0;

            var player = hasQuery ? {
                "user": request.query.user,
                "x": request.query.x,
                "y": request.query.y,
                "z": request.query.z,
                "direction": request.query.direction,
            } : {};

            //check if database.player already has an existing player.user
            var playerExists = DataBase.players.find(function (element) {
                return element.user === player.user;
            });

            if (!playerExists) {
                DataBase.players.push(player);
                console.log("Added Player " + player.user.toString() + "...");
            }

            var data = hasQuery ? request.query : {};
                data.headers = hasHeaders ? request.headers : {};
                data.players = DataBase.players || [];

            console.log(`${request.url} => ${data.players}`);

            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(data.player, getCircularReplacer()));
        });

        this.app.get('/player/update', function (request, response) {

            const hasQuery = Object.keys(request.query).length > 0;
            const hasHeaders = Object.keys(request.headers).length > 0;

            var player = hasQuery ? {
                "user": request.query.user,
                "x": request.query.x,
                "y": request.query.y,
                "z": request.query.z,
                "direction": request.query.direction,
            } : {};

            console.log("Updating Player " + player.user.toString() + "...");
            DataBase.players.forEach(function(element, index) {
                if(element.user === player.user) {
                    DataBase.players[index] = player;
                    console.log("Updated Player Successfully...");
                }
            });

            var data = hasQuery ? request.query : {};
                data.headers = hasHeaders ? request.headers : {};
                data.players = DataBase.players || [];

            console.log(`${request.url} => ${data.players}`);

            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(data.players, getCircularReplacer()));
        });

        this.app.get('/player/list', function (request, response) {

            const hasQuery = Object.keys(request.query).length > 0;
            const hasHeaders = Object.keys(request.headers).length > 0;

            console.log("Retreiving all players in database...");

            var data = hasQuery ? request.query : {};
                data.headers = hasHeaders ? request.headers : {};
                data.players = DataBase.players || [];

            console.log(`${request.url} => ${data.players}`);

            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(data.players, getCircularReplacer()));
        });

        return this;
    }

    getUrl() {
        return `http://0.0.0.0:${this.port}`;
    }

    getUrlSecure() {
        return `https://0.0.0.0:${this.port}`;
    }
}

module.exports.default = new DataServer(8421);