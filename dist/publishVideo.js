"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRail = void 0;
var axios = require("axios");
var fs = require("fs");
var fsPromises = fs.promises;
var path = require("path");
var FormData = require("form-data");
var TestRailLogger = require("./testrail.logger");
var TestRailCache = require("./testrail.cache");
const chalk = require("chalk");
var base = process.env.base ;
var username = process.env.username;
var pwd = process.env.pwd;
var vName = process.env.vName;
var vFolder = process.env.vFolder;
var resId = process.env.resId;
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

process.on('disconnect', function() {
    fs.readdir(vFolder, function (err, files) {
            if (err) {
                return console.log("Unable to scan videos folder: " + err);
            }
            files.forEach(function (file) {
                if (file.includes(vName) ){
                    try {
                        uploadAttachment(resId, vFolder +'/'+ file);

                    }
                    catch (err) {
                        console.log("Video upload error: ", err);
                    }
                }
            });
        });
});
const uploadAttachment = async function (resultId, path) {
        var form = new FormData();
        try{
            var filehandle = await fsPromises.open(path, 'r');
            await filehandle.readFile();
            form.append("attachment", fs.createReadStream(path));
            axios({
                method: "post",
                url: base + "/add_attachment_to_result/" + resultId,
                headers: __assign({}, form.getHeaders()),
                auth: {
                    username: username,
                    password: pwd
                },
                data: form,
            }).catch(function (error) { return console.error(error); });
        }catch (err){
            console.error(err)
        }finally {

            if (filehandle) {
                await filehandle.close();
            }
        }
    };



