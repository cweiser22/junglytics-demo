# Junglytics Demo

A simple serverless service to demonstrate competency with some of the stack used at Junglytics.

This basic service performs some operations on project data. There are two entites, Projects and Tasks, stored in a denormalized format on one DynamoDB table. Since it's just a quick demo, it might be a bit rough around the edges (i.e. no append slash on URLs).

There are five functions, each of which is an HTTP endpoints.

## Get all projects.

- PATH: `/projects`
- METHOD: `GET`

Returns a list of all projects, without their tasks.

## Get one project

- PATH: `/projects/{projectId}`
- METHOD: `GET`

Returns one project with its associated tasks.

## Create project

- PATH: `/projects`
- METHOD: `POST`

Create a new project, passing `name` in the JSON request body.

## Create tasks

- PATH: `/projects/${projectId}/tasks`
- METHOD: `POST`

Create a new task, which is assigned to the project with the specified `projectId`. Pass `title` in the JSON request body.

## Mark task as complete

- PATH: `/projects/${projectId}/tasks/{taskId}`
- METHOD: `PATCH`

Updates the `completed` field of a task to `true`.

