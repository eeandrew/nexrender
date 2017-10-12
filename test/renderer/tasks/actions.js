'use strict';

const chai      = require('chai');
const chaiAsFs  = require('chai-fs');
const chaiProm  = require('chai-as-promised');
const fs        = require('fs-extra');
const path      = require('path');
const rewire    = require('rewire');

chai.use(chaiAsFs);
chai.use(chaiProm);

global.should = chai.should();

process.env.RESULTS_DIR = path.join('test', 'results');

// require module
var actions = rewire('../../../renderer/tasks/actions.js');

describe('Task: actions', () => {
    let project = {
        uid: 'work',
        resultname: 'result.mov',
        workpath: path.join('test', 'work')
    };

    beforeEach(() => {
        fs.mkdirSync(path.join('test', 'work'));
        fs.writeFileSync(path.join('test', 'work', 'result.mov'));
    });

    afterEach(() => {
        fs.removeSync(path.join('test', 'work'));
        fs.removeSync(path.join('test', 'results'));
    });

    it('should create results folder if it doesn\'t exists', (done) => {
        actions(project).should.be.fulfilled.then(() => {
            path.join('test', 'results').should.be.a.directory().and.not.empty;
        }).should.notify(done);
    });

    it('should move resulted file from temp to results', (done) => {
        actions(project).should.be.fulfilled.then(() => {
            path.join('test', 'temp', 'result.mov').should.not.be.path();
            path.join('test', 'results', project.uid + '_result.mov').should.be.a.path();
        }).should.notify(done);
    });

    it('should override exsited file in result folder', (done) => {
        fs.mkdirSync(path.join('test', 'results'));
        fs.writeFileSync(path.join('test', 'results', 'work_result.mov'));

        actions(project).should.be.fulfilled.then(() => {
            path.join('test', 'temp', 'result.mov').should.not.be.path();
            path.join('test', 'results', project.uid + '_result.mov').should.be.a.path();
        }).should.notify(done);
    });

    describe('when project is jpeg sequence', () => {

        beforeEach(() => {
            project.settings = { outputExt: 'jpg' };

            fs.writeFileSync(path.join('test', 'work', 'result_00001.jpg'));
            fs.writeFileSync(path.join('test', 'work', 'result_00002.jpg'));
        });

        it('should create subfolder, and move all resulted images into it', (done) => {
            actions(project).should.be.fulfilled.then(() => {
                path.join('test', 'work', 'result_00001.jpg').should.not.be.path();
                path.join('test', 'work', 'result_00002.jpg').should.not.be.path();
                path.join('test', 'results', project.uid, 'result_00001.jpg').should.be.a.path();
                path.join('test', 'results', project.uid, 'result_00002.jpg').should.be.a.path();
            }).should.notify(done);
        });

        it('should override images if they are already exist', (done) => {
            fs.mkdirSync(path.join('test', 'results'));
            fs.mkdirSync(path.join('test', 'results', project.uid));
            fs.writeFileSync(path.join('test', 'results', project.uid, 'result_00001.jpg'));
            fs.writeFileSync(path.join('test', 'results', project.uid, 'result_00002.jpg'));

            actions(project).should.be.fulfilled.then(() => {
                path.join('test', 'work', 'result_00001.jpg').should.not.be.path();
                path.join('test', 'work', 'result_00002.jpg').should.not.be.path();
                path.join('test', 'results', project.uid, 'result_00001.jpg').should.be.a.path();
                path.join('test', 'results', project.uid, 'result_00002.jpg').should.be.a.path();
            }).should.notify(done);
        });
    });
});
