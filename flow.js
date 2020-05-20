#!/usr/bin/env node
// @flow

/**
 * This action runs `flow` and reports any type errors it encounters.
 *
 * It expects the path to `flow-bin` to be provided as the first argument, and
 * it runs flow in the current working directory.
 *
 * It uses `send-report.js` to support both running locally (reporting to
 * stdout) and under Github Actions (adding annotations to files in the GitHub
 * UI).
 */

// $FlowFixMe: shhhhh
require('@babel/register'); // flow-uncovered-line

const sendReport = require('actions-utils/send-report');
const execProm = require('actions-utils/exec-prom');

const fs = require('fs');

async function run(flowBin) {
    const {stdout} = await execProm(`${flowBin} --json`);
    const data /*:{
        errors: Array<{
            message: Array<{
                path: string,
                loc: {
                    start: {line: number, column: number},
                    end: {line: number, column: number},
                },
                descr: string,
            }>
        }>
    }*/ =
        /* flow-uncovered-block */
        JSON.parse(stdout);
    /* end flow-uncovered-block */
    if (!data.errors.length) {
        console.log('No errors');
        return;
    }
    const annotations = [];
    data.errors.forEach(error =>
        error.message.forEach(message =>
            annotations.push({
                path: message.path,
                start: message.loc.start,
                end: message.loc.end,
                annotationLevel: 'failure',
                message: message.descr,
            }),
        ),
    );
    await sendReport('Flow', annotations);
}

const getFlowBin = () /*:string*/ => {
    if (process.env['INPUT_FLOW-BIN']) {
        return process.env['INPUT_FLOW-BIN'];
    }
    const guess = 'node_modules/.bin/flow';
    if (fs.existsSync(guess)) {
        return guess;
    }
    console.error('No flow-bin found (pass in as an input)');
    process.exit(1);
    throw new Error();
};

// flow-next-uncovered-line
run(getFlowBin()).catch(err => {
    console.error(err); // flow-uncovered-line
    process.exit(1);
});
