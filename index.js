const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const fs = require('fs');

// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1wZhPLMCHKJvwOkP4juclhjFgqIY8fQFMemwKL2c64vk');
var sheet;

var output = {};
var dataSetCount = 0;

async.series([
    function setAuth(step) {
        var credentials = require('./google-generated-config.json');
        doc.useServiceAccountAuth(credentials, step);
    },
    function getInfoAndWorksheets(step) {
        doc.getInfo(function(err, info) {
            if(err) {
                return console.log('ERR:', err);
            }
            console.log('Loaded doc: '+info.title+' by '+info.author.email);
            sheet = info.worksheets[0];
            console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
            step();
        });
    },
    function buildHash(step) {
        // google provides some query options
        sheet.getRows({
            offset: 1,
            limit: 200,
            orderby: 'edition'
        }, function( err, rows ){

            // sets sorting to reverse chron
            rows.reverse();

            dataSetCount = rows.length; //columnNames:['edition', 'headline', 'links', 'text']
            rows.forEach(function (row) {

                if(!output[row.edition]) {
                    output[row.edition] = {datasets:[]};
                }

                var outputRow = {links: row.links, edition:row.edition, headline: row.headline, text: row.text};
                output[row.edition].datasets.push(outputRow);
            });

            step();
        });
    },
    function buildMarkDown(step) {
        var text ='# [Data Is Plural](https://tinyletter.com/data-is-plural)\n\n';
        text += 'Sign-up for newsletter @ https://tinyletter.com/data-is-plural\n';
        for (var edition in output) {
            //console.log('## Edition:', edition, output[edition].datasets.length, 'datasets');

            text += '\n## Edition '+ edition + '\n';

            output[edition].datasets.forEach(function (dataset) {
               text += '\n### '+ dataset.headline +'\n\n' +
                   dataset.links +'\n' +
                   '\n'+ dataset.text +'\n';
            });
        }

        fs.writeFile('./archive.md', text, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log('archive.md saved');
        });
    }
]);
