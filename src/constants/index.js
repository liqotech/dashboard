export const APP_NAME = 'LiqoDash';
export const LIQO_NAMESPACE = 'liqo';
export const VERSION = 'v1alpha1';
export const TEMPLATE_GROUP = 'dashboard.liqo.io';
export const LIQO_LABEL_ENABLED = 'liqo.io/enabled=true';
export const testTimeout = 25000;
export const DashboardConfigCRD = {
  metadata: {},
  spec: {
    group: TEMPLATE_GROUP,
    version: VERSION,
    names: {
      kind: 'DashboardConfig',
      plural: 'dashboardconfigs'
    }
  }
}
export const CustomViewCRD = {
  metadata: {},
  spec: {
    group: TEMPLATE_GROUP,
    version: VERSION,
    names: {
      kind: 'View',
      plural: 'views'
    }
  }
}
