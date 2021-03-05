<img width=17% src="./docs/images/dash-logo.png" align="right">

# Liqo*Dash* [![Coverage Status](https://coveralls.io/repos/github/LiqoTech/dashboard/badge.svg?branch=master)](https://coveralls.io/github/LiqoTech/dashboard?branch=master) [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard?ref=badge_shield)
> *A customizable dashboard for Kubernetes*

Liqo*Dash* is a general purpose, dynamic and fully customizable dashboard for Kubernetes. It let you create your own views, and fully customize your resources.

## Features
- **Visualize**: View your components, resources and shared applications with a user-friendly,
  easy to explore UI.
- **Manage**: Every Kubernetes resources, can be added, modified or deleted in your cluster
  directly from the dashboard.
- **No more YAML**: With the implementation of a fully dynamic form generator,
  you can create (or update) your resources without the need of writing YAML manifests (still, that option is
  available)
- **Dynamic Dashboard**: Liqo*Dash* meets the need for a generic user to have under control only what is necessary, offering the
  possibility to easily create dynamic views directly accessible in the dashboard, with just the components
  they need to monitor.
- **Customize**: Liqo*Dash* offers a simple way to customize the representation of resources, letting the user
  choose what parameters to see first.
- **Authentication**: The access to you cluster is secure and managed in two ways: through an OIDC provider
  (e.g keycloak) or with a secret token generated in your cluster.
- **Real time event responsiveness**: If a resource or component gets updated the dashboard will be automatically updated
  without the need to refresh the page.

<a name="table_of_contents"></a>
## Table of Contents

- [Getting Started](#Getting_started)
- [Accessing the Dashboard](#Access)
  - [Running Liqo*Dash* with NodePort](#Nodeport)
  - [Running Liqo*Dash* with Port-Forward](#Portforward)
  - [Running Liqo*Dash* with an Ingress](#Ingress)
  - [Differences between access methods](#Differences)
- [Authentication](#Authentication)
  - [Login with Token](#Token)
  - [Login with OpenId Connect (OIDC)](#oidc)
- [Documentation](#Documentation)
- [License](#License)

<a name="Getting_started"></a>
## Getting Started
**Liqo*Dash*** can be installed using Helm, executing the following commands:
```
# Clone the dashboard repository
git clone https://github.com/liqotech/dashboard
# Install the dashboard
helm install liqo-dashboard ./dashboard/kubernetes/dashboard_chart --namespace <NAMESPACE> --set version=<VERSION> --set ingress=<INGRESS_HOSTNAME>
```
- If no namespace is defined, the dashboard will be installed in the `default` namespace.
- If no version is defined, the version of the dashboard will be `latest`.
- If no ingress is defined, the ingress will not be installed.

**NOTE:** from now on, all the commands refer to a dashboard installed in the `default` namespace.

<a name="Access"></a>
## Access

<a name="Nodeport"></a>
### NodePort
In order to access the dashboard you need to first get the port on which Liqo*Dash* is exposed, which can be done with the following command:
```
kubectl describe service liqo-dashboard | grep NodePort
```
Which will output:
```
Type:          NodePort
NodePort:      https  32421/TCP
```
In this case, the dashboard has been exposed to the port ``32421``
Now, you can access Liqo*Dash* using your master node IP and the service port you just found: ``https://<MASTER_IP>:<Liqo*Dash*_PORT>``

**NOTE:** to get your master node IP, you can run ``kubectl get nodes -o wide | grep master``, and take the
``INTERNAL-IP``

<a name="Portforward"></a>
### Port-Forward
A simple way to access the dashboard with a simpler URL than the one specified above is to use ``kubectl port-forward``.
```
kubectl port-forward service/liqo-dashboard 6443:443
```
To access Liqo*Dash* you can go to:
```
https://localhost:6443
```
**NOTE:** The PORT exposed with the port forward, that in the example is ``6443``, can be any PORT that is not already used.

<a name="Ingress"></a>
### Ingress
Liqo*Dash* can also be exposed using an [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress).
You must have an [Ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
for an Ingress resource to work. If you have one, you can specify the desired host name during the installation like this:
```
helm install liqo-dashboard ./dashboard/kubernetes/dashboard_chart --set ingress=example.dashboard.com
```
Once installed, you can see that an Ingress resource is created:
```
kubectl get ingress
```
You can access the dashboard through the provided host name.

<a name="Differences"></a>
### Differences between access methods
#### When to use Port-Forward
Using `kubectl port-forward` to access the dashboard service is usually meant for testing/debugging purposes. It is not a
long term solution, as it require to always run the port-forward and keep it active. However, if you just want to access
the dashboard via localhost, this is the easiest method.
#### When to use NodePort
Using a NodePort means that a specific port is opened on all the Nodes, and traffic sent to this port is forwarded
to a service (in this case the dashboard). Using a NodePort has its downsides (only one service per port, only accepted
ports are in the range 30000-32767...) and as such it is not recommended 
for production, but it is really convenient if you just want to test the dashboard, or you do not
have the possibility to expose it through a Load Balancer.
#### When to use Ingress
Using Ingress is probably the best way to expose Liqo*Dash*, especially if you want to access it through the internet.
It can provide load balancing, SSL termination and name-based hosting, letting you access the dashboard using
a host name instead of just its IP. Because there many types of Ingress controllers, each one with different
capabilities, it may require some work to properly set up.

<a name="Authentication"></a>
## Authentication

<a name="Token"></a>
### Login with Token
For security, Liqo*Dash* requires a Token to log in.
This token is stored within a _secret_, which is created by default during the installation, along with a _service account_ and a _cluster role binding_.

To find the token to use to log in, run the following:
```
kubectl describe secret $(kubectl get secret | grep Liqo*Dash* | awk '{print $1}')
```
Which should print something like this:
```
Name:         Liqo*Dash*-admin-sa-token-94v8x
Namespace:    default
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: Liqo*Dash*-admin-sa
              kubernetes.io/service-account.uid: ad421b68-7ca5-4f2b-9022-454eb42f880d

Type:  kubernetes.io/service-account-token

Data
====
ca.crt:     1025 bytes
namespace:  4 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6Img0d3lBRjRGWTlYbndfcnZFeWNQR2VQX3dRVjhfXzBVLTdlTG95Tm9QMW8ifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsaXFvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhLXRva2VuLTk0djh4Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiYWQ0MjFiNjgtN2NhNS00ZjJiLTkwMjItNDU0ZWI0MmY4ODBkIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmxpcW86bGlxb2Rhc2gtYWRtaW4tc2EifQ.ZX4SgxepLjDWMYtvlWUfR3Qjzhf80Jq-17JzF7DSZVMJKvqgah0JIG9Ieqj6DBQr-0xxWnTW6hosNjcdf6pm62SbuiSMwyE3xS_j3dAmCQHx5umGbnTjp6GUaMu8JiFtajOpU7-9f06W5g4I44LF1-3FwgG3OY6vVdL6CypWfjumwgh_yLKE9h7tjKl8CiSfNuLVDWHL4l07W9fEeed8lNmFg4FlvOVHmFglTjz20VKEeu964pNlgK0MRGo_cVnDJyWl7cdeEmR0qfiPup5AMQLWUvlX9RTB7UTiRyw9YYZXPrsX5sdUMVuWb-G9ZQ8eABQI7BAs4uCouuoWmIDzag
```

Now, (1) copy the token, (2) paste it in the login screen, and (3) sign in.

**NOTE:** the Liqo*Dash* Service Account has admin privileges. To find out more about permissions in Kubernetes
read the official [authentication](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)
and [authorization](https://kubernetes.io/docs/reference/access-authn-authz/authorization/) documentation.

<a name="oidc"></a>
### Login with OIDC
If you have an OIDC provider available in your cluster (such as Keycloak), you can use it to access the dashboard and bypass the standard login with the token.
In order to bind the dashboard with you OIDC provider, you have to edit the dashboard _configmap_, which represents the structure that contains the Dashboard configuration.
To do so, run the following command:
```
kubectl edit configmap liqo-dashboard-configmap
```
You should see a YAML representation of the configmap, such as the following:
```
# Please edit the object below. Lines beginning with a '#' will be ignored,
# and an empty file will abort the edit. If an error occurs while saving this file will be
# reopened with the relevant failures.
#
apiVersion: v1
...
  name: liqo-dashboard-configmap
  namespace: default
  resourceVersion: "012345"
  selfLink: /api/v1/namespaces/default/configmaps/liqo-dashboard-configmap
  uid: 0000000-993d-11e7-87e0-901b0e532516
data:
  app_title: ""
  app_favicon: ""
  oidc_client_id: ""
  oidc_client_secret: ""
  oidc_provider_url: ""
  oidc_redirect_uri: ""
kind: ConfigMap
```
Change the values under ``data`` regarding the OIDC settings and save the file.
Then, restart the dashboard:
```
kubectl rollout restart deployment liqo-dashboard
```
From now on, any attempt to login will be redirected to your OIDC provider for the authentication.

**NOTE:** you can always revert to the token login authentication by editing the configmap.

<a name="Documentation"></a>
## Documentation
The Liqo*Dash* documentation can be found in the [docs](/docs) directory which contains:
- [How to write CRD that leverage the capabilities of the dashboard](/docs/README-CRD.md).

<a name="License"></a>
## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FLiqoTech%2Fdashboard?ref=badge_large)
