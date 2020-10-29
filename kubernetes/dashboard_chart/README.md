dashboard_chart
==========
A Helm chart for Liqo Dashboard

Current chart version is `0.1.0`

## Chart Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| version | string | `"latest"` | The version of the dashboard to install. |
| ingress | string | `<none>` | The hostname used to configure an ingress for the dashboard. |
| namespace | string | `"default"` | The namespace in which the dashboard will be installed. |
