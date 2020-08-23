[![Coverage Status](https://coveralls.io/repos/github/LiqoTech/dashboard/badge.svg?branch=master)](https://coveralls.io/github/LiqoTech/dashboard?branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard?ref=badge_shield)

# LiqoDash
LiqoDash is a general purpose, dynamic dashboard that let you create your own
views, and fully customize your resources.
LiqoDash is  also a web-based UI for [Liqo](https://github.com/LiqoTech/liqo). It allows you to visualize and manage
all the Liqo components, as well as manage the status of the Liqo system itself.

![alt text](docs/images/dashboard-ui.png)

### Features
- **Visualize**: View your components, custom resources and shared applications with a user friendly,
easy to explore UI.
- **Manage**: Every Liqo component, as well as your custom resources, can be added, modified or deleted in your cluster
(all CRUD operations are supported) directly in the dashboard. 
- **No more YAML**: With the implementation of a fully dynamic CRD form generator,
you can create (or update) your custom resources without the need of writing in YAML (still, that option is
available) 
- **Configure**: The configuration is an important part of Liqo, and LiqoDash offers a dedicated view to help
users understand and choose the best configuration for their system.
- **Dynamic Dashboard**: LiqoDash meets the need for a generic user to have under control only what is necessary, offering the 
possibility to easily create dynamic views directly accessible in the dashboard, with just the components (custom resources)
they need to monitor. Components in these views are resizable and support drag and drop.
- **Customize**: Kubernetes users often work with custom resources, but there is no real way to view them besides
reading the YAML; LiqoDash offers a customizable way to manage the representation of these resources with the
usage of a built-in editor that let you choose between different templates (from the classic pie charts or bar chart,
to a more complex design such as a network graph).
- **Authentication**: The acces to you cluster's apiserver is secure and managed in two ways: through an OIDC provider 
(e.g keycloack) or with a secret token generated in your cluster.
- **Real time event responsiveness**: If a resource or component gets updated (or added/deleted) outside the dashboard,
the dashboard will be automatically updated without the need to refresh the page.

### Limitations
- **Home page**: First page that shows status and overall view of Liqo yet to implement
- **CRD templates**: The set of customizable templates can be expanded.

## Getting started
Here we take a look on how to setup LiqoDash in your development environment.

### Requirements
- Node.js 12+ and npm 6+ ([installation with nvm](https://github.com/creationix/nvm#usage))
- Docker 1.25+ ([installation manual](https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/))

### Local installation
Clone the [repository](https://github.com/LiqoTech/dashboard/tree/master) and install the dependencies with:
```
npm install
```
In order to use LiqoDash, there has to be a Kubernetes cluster running, possibly with Liqo installed (though it is
not mandatory). To connect your cluster with LiqoDash, you need to provide at least one environment variable 
`APISERVER_URL`, that is the url of your cluster's API server to whom our Kubernetes library interact with.

In order to do so, run the following:
```
export APISERVER_URL="https://<APISERVER_IP>:<APISERVER_PORT>"
```
That way, you will be asked an authentication token when accessing the dashboard.

If you have set up an OIDC provider (such as Keycloack), you can use it to access the dashboard by exporting the
following environment variables:
```
export OIDC_PROVIDER_URL="https://<YOUR_OIDC_PROVIDER>"
export OIDC_CLIENT_ID="<YOUR_CLIENT_ID>"
export OIDC_CLIENT_SECRET="<YOUR_CLIENT_SECRET>"
export OIDC_REDIRECT_URI="http://localhost:8000>"
export APISERVER_URL="https://<APISERVER_IP>:<APISERVER_PORT>"
```
**NOTE: OIDC authentication has higher priority than the one with the authentication token.**

### Running LiqoDash
When you're all set up, just run:
```
npm start
```
Open a browser and access the UI under `localhost:8000`.

### Using Docker
You can also pull the docker image:
```
docker pull liqo/dashboard:latest
```
And then run:
```
docker run --env APISERVER_URL=<APISERVER_IP>:<APISERVER_PORT> -p 8000:80 liqo/dashboard:latest
```
Open a browser and visit `localhost:8000`.

**NOTE: the command above uses the `--env` option to export the env variables needed to run the dashboard.**


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard?ref=badge_large)