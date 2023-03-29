# api-http-response

An http response module for Nodejs api that support hook notifications and has a lot of shortcuts to return a response. it also support translation

# Usage

before using this package, please create an **.env** file as follows and provide their values:

```
ALLOW_NOTIF=false | true to allow global notifications
ALLOW_LOG_NOTIF=false | true to allow error notifications
ERROR_HOOK=HOOK TO RECEIVE ERRORS LOG
LOG_HOOK=HOOK TO RECEIVE ANY LOG

```