[![build status](https://secure.travis-ci.org/openmason/cloudd.png)](http://travis-ci.org/openmason/cloudd)
# cloudd                                                  
node.js cloud engine 
Apart from all the buzz words, key aspect of this software is to specify set of tasks that are interdependent in a config file (similar to DAG input on condor) and run them.

# Basics
 * Task - is the smallest unit of execution (preferrable should be an idempotent task)
 * Job - collection of tasks with dependencies (acyclic)

# Features 
 * job execution engine
 * Task could be a javascript unit or executable that would be exec'ed
 * Command line to check the status of jobs, tasks and current running processes
 * Command line Submit of jobs
 * instantiate jobs _cron_ style
 * Good unit test coverage

## Upcoming
 * Failure of tasks to be handled
 * Job load balancing among cloudd hosts
 * Persistence of state
 * clustering among cloudd hosts
 
# Example
 * Lets see how to define a Hello My World Job
    1. Job `Hello My World` comprise of three tasks
      * `Hello` Task
      * `My` Task
      * `World` Task
    2. Dependencies
      * `My` would be run only after `Hello`
      * `World` would be run only after `My`
  * Sample yaml config file would look like (see in examples/hellomyworld.yaml)

```yaml
name: Hello World
description:
  Sample 'hello my world' job
jobs:
  my:
    executable: echo "my"
  hello:
    executable: echo "hello"
  world:
    executable: echo "world"
dependencies:
  - my-world:
     parent: [my]
     child: [world]
  - hello-my:
     parent: [hello]
     child: [my]
```

## To try this example
Have two terminals, one for the server and another one for submitting the job

    # terminal 1
    cloudd server
    
    # terminal 2
    cloudd examples/hellomyworld.yaml

## Usage
To run the server
    
    cloudd server
    
Command line utilities

    # to show current running tasks
    cloudd ps
    
    # to show total tasks that are ready to run (ordered list)
    cloudd tasks
    
    # to show total jobs in the system (non-completed)
    cloudd jobs
    
    # to submit a new job
    cloudd submit sample-job-file.yaml
    
