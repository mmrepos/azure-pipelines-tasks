import fs = require('fs');
import mockanswer = require('azure-pipelines-task-lib/mock-answer');
import mockrun = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'copyfiles.js');
let runner: mockrun.TaskMockRunner = new mockrun.TaskMockRunner(taskPath);
runner.setInput('Contents', '**');
runner.setInput('SourceFolder', path.normalize('/srcDir'));
runner.setInput('TargetFolder', path.normalize('/destDir'));
runner.setInput('CleanTargetFolder', 'false');
runner.setInput('ignoreMakeDirErrors', 'false');
runner.setInput('Overwrite', 'false');
let answers = <mockanswer.TaskLibAnswers> {
    checkPath: { },
    find: { },
};
answers.checkPath[path.normalize('/srcDir')] = true;
answers.find[path.normalize('/srcDir')] = [
    path.normalize('/srcDir'),
    path.normalize('/srcDir/someOtherDir'),
    path.normalize('/srcDir/someOtherDir/file1.file'),
    path.normalize('/srcDir/someOtherDir/file2.file'),
];
runner.setAnswers(answers);

fs.existsSync = (itemPath: string) => {
    switch (itemPath) {
        case path.normalize('/srcDir/someOtherDir'):
        case path.normalize('/srcDir/someOtherDir/file1.file'):
        case path.normalize('/srcDir/someOtherDir/file2.file'):
            return true;
        default:
            return false;
    }
}

fs.statSync = (itemPath: string) => {
    const itemStats: fs.Stats = new fs.Stats();
    switch (itemPath) {
        case path.normalize('/srcDir/someOtherDir'):
            itemStats.isDirectory = () => true;
            break;
        case path.normalize('/srcDir/someOtherDir/file1.file'):
        case path.normalize('/srcDir/someOtherDir/file2.file'):
            itemStats.isDirectory = () => false;
            break;
        default:
            throw { code: 'ENOENT' };
    }
    return itemStats;
}

runner.registerMockExport('mkdirP', (p: string) => {
    console.log(`mkdirP: ${p}`);
    
    throw "Error during creation of target folder."
});

// as a precaution, disable fs.chmodSync. it should not be called during this scenario.
fs.chmodSync = null;
runner.registerMock('fs', fs);

runner.run();
