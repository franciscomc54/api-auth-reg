'use strict'

const port = process.env.PORT || 4000

const https = require('https');
const fs = require('fs');

const OPTIONS_HTTPS = {
    key: fs.readFileSync('./cert/key.pem'),
    cert: fs.readFileSync('./cert/cert.pem')
}

const express = require('express');
const logger = require('morgan');
const mongojs = require('mongojs');

const cors = require('cors');

const app = express();

const PassService = require('../auth-test/services/pass.service');
const TokenService = require('../auth-test/services/token.service')
const moment = require('moment');

var db = mongojs("SD");
var id = mongojs.ObjectId;

var allowCrossTokenHeader = (req, res, next) => {
    res.header("Access-Control-Allow-Headers", "*");
    return next();
};

var allowCrossTokenOrigin = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    return next();
};

var auth = (req, res, next) => {
    if(req.headers.token === "password1234") {
        return next();
    } else {
        return next(new Error("No autorizado"));
    };
};

app.use(logger('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());
app.use(allowCrossTokenHeader);
app.use(allowCrossTokenOrigin);

//GET
app.get('/api', (req, res, next) => {
    console.log('GET /api');
    console.log(req.params);
    console.log(db.user);

    db.getCollectionNames((err, colecciones) => {
        if(err) return next(err);
        res.json(colecciones);
    });
});

app.get('/api/user', (req, res, next) => {
    db.user.find((err, coleccion) => {
        if(err) return next(err);
        res.json(coleccion);
    });
});

app.get('/api/user/:id', (req, res, next) => {
    db.user.findOne({_id: id(req.params.id) }, (err, elemento) => {
        if(err) return next(err);
        res.json(elemento);
    });
});

app.get('/api/auth', (req, res, next) => {
    db.user.find((err, coleccion) => {
        if(err) return next(err);
        res.json(coleccion);
    });
});

//POST
//signup
/*
body:
    "name": "Paco Maciá"
    "email": pmacia@dtic.ua.es
    "pass":"1234"

respuesta:
    "result": "OK",
    "token": "kjasdhfjlekjfoiaj...",
    "usuario": {
        "email": "pmacia@dtic.ua.es",
        "displayName": Paco Maciá",
        "password": "$2alskdjfoijelskdjfojalñskjfo",
        "signupDate": 1604428206,
        "lastLogin"; 1604428206,
        "_id": "5fa4ds548494d58c4fe8d"
    }
*/
app.post('/api/user', auth, (req, res, next) => {
    const elemento = req.body;

    if(!elemento.nombre) {
        res.status(400).json({
            error: 'Bad data',
            description: 'Se precisa al menos un campo <nombre>'
        });
    } else {
        const coleccion = {
            "email": req.body.email,
            "displayName": req.body.nombre,
            "password": PassService.encriptaPassword(req.body.password),
            "signupDate": moment().unix(),
            "lastLogin": moment().unix()
        }
        db.user.save(elemento, (err, coleccion) => {
            if(err) return next(err);
            res.json(coleccion);
        });
    }
});

//signin
/*
body:
    "email": pmacia@dtic.ua.es
    "pass":"1234"

respuesta:
    "result": "OK",
    "token": "kjasdhfjlekjfoiaj...",
    "usuario": {
        "email": "pmacia@dtic.ua.es",
        "displayName": Paco Maciá",
        "password": "$2alskdjfoijelskdjfojalñskjfo",
        "signupDate": 1604428206,
        "lastLogin"; 1604428206,
        "_id": "5fa4ds548494d58c4fe8d"
    }
*/
app.post('/api/auth', auth, (req, res, next) => {
    const elemento = req.body;

    if(!elemento.nombre) {
        res.status(400).json({
            error: 'Bad data',
            description: 'Se precisa al menos un campo <nombre>'
        });
    } else {
        db.auth.save(elemento, (err, coleccionGuardada) => {
            if(err) return next(err);
            res.json(coleccionGuardada);
        });
    }
});

//PUT
app.put('/api/user/:id', auth, (req, res, next) => {
    let elementoId = req.params.id;
    let elementoNuevo = req.body;
    db.user.update({_id: id(elementoId)},
        {$set: elementoNuevo}, {safe: true, multi: false}, (err, elementoModif) => {
            if(err) return next(err);
            res.json(elementoModif);
        });
});

//DELETE
app.delete('/api/user/:id', auth, (req, res, next) => {
    let elementoId = req.params.id;

    db.user.remove({_id: id(elementoId)}, (err, resultado) => {
        if(err) return next(err);
        res.json(resultado);
    });
});

//INICIO
https.createServer( OPTIONS_HTTPS, app ).listen(port, () => {
    console.log(`SEC WS API REST CRUD ejecutandose en https://localhost:${port}/api/:coleccion/:id`);
});