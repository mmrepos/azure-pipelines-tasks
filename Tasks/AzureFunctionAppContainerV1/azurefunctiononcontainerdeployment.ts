import tl = require('azure-pipelines-task-lib/task');
import path = require('path');
import { TaskParameters, TaskParametersUtility } from './taskparameters';
import { AzureFunctionOnContainerDeploymentProvider } from './azurefunctiononcontainerprovider';
import * as Endpoint from 'azure-pipelines-tasks-azurermdeploycommon-v3/azure-arm-rest/azure-arm-endpoint';

async function main() {
    let isDeploymentSuccess: boolean = true;

    try {
        tl.setResourcePath(path.join( __dirname, 'task.json'));
        tl.setResourcePath(path.join( __dirname, 'node_modules/azure-pipelines-tasks-azurermdeploycommon-v3/module.json'));
        var taskParams: TaskParameters = await TaskParametersUtility.getParameters();
        var deploymentProvider = new AzureFunctionOnContainerDeploymentProvider(taskParams);

        tl.debug("Predeployment Step Started");
        await deploymentProvider.PreDeploymentStep();

        tl.debug("Deployment Step Started");
        await deploymentProvider.DeployWebAppStep();
    }
    catch(error) {
        tl.debug("Deployment Failed with Error: " + error);
        isDeploymentSuccess = false;
        tl.setResult(tl.TaskResult.Failed, error);
    }
    finally {
        if(deploymentProvider != null) {
            await deploymentProvider.UpdateDeploymentStatus(isDeploymentSuccess);
        }
        
        Endpoint.dispose();
        tl.debug(isDeploymentSuccess ? "Deployment Succeded" : "Deployment failed");

    }
}

main();
