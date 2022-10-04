"use strict";
const AWS = require('aws-sdk');
const uniqueSlug = require('unique-slug')

// creates a new project
module.exports.createProject = async (event) => {

  // parse the request body
  const body = JSON.parse(event.body);

  const dynamoDb = new AWS.DynamoDB.DocumentClient();

  // make a unique id
  const createdId = uniqueSlug();

  // create the project
  const putParams = {
    TableName: process.env.DYNAMODB_PROJECT_TABLE,
    Item: {
      PK: "PROJECT#" + createdId,
      SK: "METADATA#" + createdId,
      name: body.name
    },
  };
  await dynamoDb.put(putParams).promise();

  return {
    statusCode: 201,
  };
}

// fetches all projects without their tasks
module.exports.getAllProjects = async (event) => {
  // grabs all projects
  const scanParams = {
    TableName: process.env.DYNAMODB_PROJECT_TABLE,
    FilterExpression:"begins_with(#sk, :meta)",
    ExpressionAttributeNames:{
      "#sk": 'SK'
    },
    ExpressionAttributeValues: {
      ":meta": "METADATA#",
    }
  };
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const result = await dynamodb.scan(scanParams).promise();
  
  // return error if no projects were retrieved
  if (result.Count === 0) {
    return {
      statusCode: 404,
    };
  }
  // send over the formatted result
  return {
    statusCode: 200,
    body: JSON.stringify({
      total: result.Count,
      items: await result.Items.map((project) => {
        return {
          id: project.SK.substring(9),
          name: project.name
        }
      })
    })
  }
 
}

// grab one project with its tasks
module.exports.getOneProject = async (event) => {
  const projectId = event.pathParameters.projectId;

  // query and get result
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const queryParams = {
    TableName: process.env.DYNAMODB_PROJECT_TABLE,
    ExpressionAttributeValues:{
      ":pk": "PROJECT#" + projectId,
    },
    KeyConditionExpression: "PK = :pk",
  }
  const result = await dynamodb.query(queryParams).promise();

  // send if project doesn't exist
  if (result.Count == 0){
    return {
      statusCode: 404
    }
  }

  // what will be sent in the response
  let formattedResult = {
    projectId,
    name: '',
    tasks:[]
  }

  // populated formattedResult
  result.Items.map((projectItem) => {
    if (projectItem.SK.substring(0,4) == "Task"){
      formattedResult.tasks.push({
        taskId: projectItem.SK.substring(5),
        title: projectItem.title
      });
    } else {
      formattedResult.name = projectItem.name;
    }
  })

  return {
    statusCode: 200,
    body: JSON.stringify(formattedResult)
  }
}

module.exports.createTask = async (event) => {
  // parse the body
  const body = JSON.parse(event.body);

  // create task id, store projectId for readability
  const taskId = uniqueSlug();
  const projectId = event.pathParameters.projectId

  // create the task
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const putParams = {
    TableName: process.env.DYNAMODB_PROJECT_TABLE,
    Item: {
      PK: "PROJECT#" + projectId,
      SK: "Task#" + taskId,
      title: body.title,
      completed: false
    },
  };
  await dynamoDb.put(putParams).promise();

  return {
    statusCode: 201,
  };
}

// simple changes completed to true
module.exports.markTaskComplete = async (event) => {
  // grab task id and project id from path
  const taskId = event.pathParameters.taskId;
  const projectId = event.pathParameters.projectId;

  // perform the update
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: process.env.DYNAMODB_PROJECT_TABLE,
    Key:{
      PK: "PROJECT#" + projectId,
      SK:"Task#" + taskId
    },
    ExpressionAttributeNames: {
      "#c": "completed"
    },
    ExpressionAttributeValues:{
      ":t": true
    },
    UpdateExpression:"set #c = :t"

  };
  await dynamoDb.update(updateParams).promise();

  return {
    statusCode: 204,
  };
}