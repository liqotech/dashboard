export const APP_NAME = 'LiqoDash';
export const LIQO_NAMESPACE = 'liqo';
export const VERSION = 'v1alpha1';
export const TEMPLATE_GROUP = 'dashboard.liqo.io';
export const LIQO_LABEL_ENABLED = 'liqo.io/enabled=true';
export const testTimeout = 25000;
export const DashboardConfigCRD = {
  metadata: {
    name: 'dashboardconfigs.dashboard.liqo.io'
  },
  spec: {
    group: TEMPLATE_GROUP,
    version: VERSION,
    names: {
      kind: 'DashboardConfig',
      plural: 'dashboardconfigs'
    }
  }
};
export const CustomViewCRD = {
  metadata: {
    name: 'views.dashboard.liqo.io'
  },
  spec: {
    group: TEMPLATE_GROUP,
    version: VERSION,
    names: {
      kind: 'View',
      plural: 'views'
    }
  }
};
export const defaultConfig = {
  apiVersion: TEMPLATE_GROUP + '/' + VERSION,
  kind: 'DashboardConfig',
  metadata: { name: 'default-config' },
  spec: {
    default: true,
    enabled: true,
    footer: { enabled: false },
    sidebar: { enabled: true },
    header: {
      namespaceSelector: true,
      resourceSearch: true
    },
    resources: []
  }
};
