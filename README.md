# news_updated
Azure AI Hackaton Entry - Your news, updated 

## Installation instructions

### Azure Components

1. Create an Azure Cognitive Services - Text Analytics resource. Make a note of its accessKey and endpoint.
2. Create a Bing Search resouce. Also make a note of the endpoint and accessKey.
3. Create an Azure Function App. You will be prompted to create a resource group (for logging, etc.)
4. Create two functions: getBarebonesNews and getBingNewsSearch. Upload their respective index.js files that you can find under the azure functions folder in this repo. Be sure to use your applicationKeys and endpoints here.
5. Configure Integration of both functions to be triggered by an HTTP request, and to serve both the GET and POST methods.
6. Navigate to the Debug console https://<name of your azure function app created in step 3>.scm.azurewebsites.net/DebugConsole 
7. In the console navigate to c:\site\wwwroot and there copy file package.json that you can find in the azure functions folder in this repo. Yes, one package.json for both functions.
8. Run npm install --save

Done!

### Extension

1. Download the extension folder somewhere in your machine.
2. Edit invokeAzureAPI.js to refer to your accessKeys and endpoints.
3. Install the Edge extension following these official instructions: https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading
4. Done! Easy peasy!

You should see a blue NEWS icon besides your navigation bar in Edge. Find an interesting piece of news and click away!

