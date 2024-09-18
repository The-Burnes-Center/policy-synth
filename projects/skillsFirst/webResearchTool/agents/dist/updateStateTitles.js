"use strict";
// updateStateTitles.ts
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var csv = require("csv-parser");
function readCSVFile(csvFilePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var records = new Map();
                    fs.createReadStream(csvFilePath)
                        .pipe(csv())
                        .on('data', function (data) {
                        var record = {
                            titleCode: data['Title Code'].trim(),
                            multiLevelJob: data['Multilevel Job'].trim(),
                            cscRevised: data['CSC Revised'].trim(),
                            notes: data['Notes'].trim(),
                            occupationalCategory: data['Occupational Sub Category ID'].trim(),
                        };
                        records.set(record.titleCode, record);
                    })
                        .on('end', function () {
                        resolve(records);
                    })
                        .on('error', function (error) {
                        reject(error);
                    });
                })];
        });
    });
}
function readTypeScriptArray(tsFilePath) {
    var fileContent = fs.readFileSync(tsFilePath, 'utf-8');
    return fileContent;
}
function updateJobDescriptions(tsContent, csvData) {
    var arrayRegex = /const stateTitlesNJJobDescriptions: JobDescription\[\] = (\[[\s\S]*?\]);/m;
    var match = tsContent.match(arrayRegex);
    if (!match) {
        throw new Error('Could not find the stateTitlesNJJobDescriptions array in the TypeScript file.');
    }
    var arrayContent = match[1];
    var jobDescriptions;
    try {
        // Evaluate the array content safely
        jobDescriptions = eval('(' + arrayContent + ')');
    }
    catch (error) {
        throw new Error('Error parsing the job descriptions array.');
    }
    var updatedJobDescriptions = jobDescriptions.map(function (job) {
        var csvRecord = csvData.get(job.titleCode);
        if (csvRecord) {
            return __assign(__assign({}, job), { multiLevelJob: csvRecord.multiLevelJob.toLowerCase() === 'true', cscRevised: csvRecord.cscRevised.toLowerCase() === 'true', notes: csvRecord.notes || job.notes, occupationalCategory: parseOccupationalCategory(csvRecord.occupationalCategory) });
        }
        return job;
    });
    // Stringify the updated array
    var updatedArrayString = 'const stateTitlesNJJobDescriptions: JobDescription[] = ' + JSON.stringify(updatedJobDescriptions, null, 2) + ';';
    // Replace the old array in the content
    var updatedTSContent = tsContent.replace(arrayRegex, updatedArrayString);
    return updatedTSContent;
}
function parseOccupationalCategory(categoryStr) {
    // Split the IDs and trim whitespace
    return categoryStr.split(',').map(function (id) { return id.trim(); }).filter(function (id) { return id; });
}
(function main() {
    return __awaiter(this, void 0, void 0, function () {
        var csvFilePath, tsFilePath, csvData, tsContent, updatedTSContent, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    csvFilePath = path.resolve(__dirname, './src/master_sheet_skillsbased_StateTitle_Analysis.csv');
                    tsFilePath = path.resolve(__dirname, './src/stateTitlesNJJobDescriptions.ts');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, readCSVFile(csvFilePath)];
                case 2:
                    csvData = _a.sent();
                    tsContent = readTypeScriptArray(tsFilePath);
                    updatedTSContent = updateJobDescriptions(tsContent, csvData);
                    // Write the updated content back to the TypeScript file
                    fs.writeFileSync(tsFilePath, updatedTSContent, 'utf-8');
                    console.log('Job descriptions updated successfully.');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
})();
