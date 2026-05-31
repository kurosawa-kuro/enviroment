```
cd /home/wsl/local_ubuntu/environment-kit/platform/ec2-ubuntu/eks/infrastructure/cloudformation

node ./scripts/cleanup/cleanup-resources.js

# make workflow-run-01-03
node ./scripts/workflow/workflow-run-01-03.js 

make workflow-run-04

```


```
make destroy

node ./scripts/cleanup/cleanup-resources.js
```


```
node ./scripts/workflow/workflow-run-04.js 

```
